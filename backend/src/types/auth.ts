import { Request } from 'express';

export interface User {
  id: string;
  address: string;
  nonce: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    address: string;
  };
}

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
