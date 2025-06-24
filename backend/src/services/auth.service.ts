import { PrismaClient } from '@prisma/client';
import { verifyMessage } from 'ethers';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface LoginRequest {
  address: string;
  signature: string;
  message: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    address: string;
    nonce: string;
  };
  expiresIn?: string;
  error?: string;
}

export class AuthService {

  async generateNonce(address: string): Promise<string> {
    try {
      const normalizedAddress = address.toLowerCase();
      logger.info(`🔑 Generating nonce for address: ${normalizedAddress}`);
      
      const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const user = await prisma.user.upsert({
        where: { address: normalizedAddress },
        update: { nonce },
        create: { 
          address: normalizedAddress, 
          nonce 
        }
      });

      logger.info(`✅ Nonce generated for user: ${user.id}`);
      return nonce;
      
    } catch (error) {
      logger.error('❌ Error generating nonce:', error);
      throw new Error('Failed to generate nonce');
    }
  }

  generateLoginMessage(address: string, nonce: string): string {
    return `Welcome to DefiGuardian AI!

This request will not trigger a blockchain transaction or cost any gas fees.

Your authentication status will reset after 24 hours.

Wallet address: ${address}
Nonce: ${nonce}

By signing this message, you agree to our Terms of Service and Privacy Policy.`;
  }

  async verifyAndLogin(request: LoginRequest): Promise<LoginResponse> {
    try {
      const { address, signature, message } = request;
      const normalizedAddress = address.toLowerCase();
      
      logger.info(`🔐 Verifying login for address: ${normalizedAddress}`);

      const user = await prisma.user.findUnique({
        where: { address: normalizedAddress }
      });

      if (!user) {
        logger.warn(`❌ User not found: ${normalizedAddress}`);
        return { success: false, error: 'User not found. Please request a nonce first.' };
      }

      try {
        const recoveredAddress = verifyMessage(message, signature);
        
        if (recoveredAddress.toLowerCase() !== normalizedAddress) {
          logger.warn(`❌ Signature verification failed for: ${normalizedAddress}`);
          return { success: false, error: 'Invalid signature' };
        }
      } catch (signatureError) {
        logger.error('Signature verification error:', signatureError);
        return { success: false, error: 'Invalid signature format' };
      }

      const newNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { nonce: newNonce }
      });

      const userNonce = updatedUser.nonce || newNonce;
      
      const payload = { 
        userId: updatedUser.id,
        address: updatedUser.address
      };
      
      // ✅ CORREÇÃO DO JWT - Sem options problemáticas
      const token = jwt.sign(payload, config.jwtSecret);

      logger.info(`✅ Successful login for: ${normalizedAddress}`);
      
      return {
        success: true,
        token,
        user: {
          address: updatedUser.address,
          nonce: userNonce
        },
        expiresIn: '7d'
      };

    } catch (error) {
      logger.error('Error in verifyAndLogin:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      return user;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      return null;
    }
  }

  async getUserByAddress(address: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() }
      });
      return user;
    } catch (error) {
      logger.error('Error getting user by address:', error);
      return null;
    }
  }

  verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      return decoded;
    } catch (error) {
      logger.error('Token verification error:', error);
      return null;
    }
  }
}

export const authService = new AuthService();