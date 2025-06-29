// hooks/useAuth.ts
// ✅ HOOK USEAUTH COM SUPABASE APENAS - SEM NEXTAUTH

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from '@supabase/ssr';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: string;
  walletAddress?: string;
  createdAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Inicializar autenticação e listeners
  const loadUserProfile = useCallback(async (email: string) => {
    if (!email) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        return;
      }

      if (data) {
        setProfile({
          id: data.id.toString(),
          email: data.email,
          name: data.name,
          image: data.image,
          provider: data.provider,
          walletAddress: data.wallet_address,
          createdAt: data.created_at,
        });
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }, [supabase]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        loadUserProfile(session.user.email);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user?.email) {
          loadUserProfile(session.user.email);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserProfile, supabase.auth]);

  const updateWalletAddress = async (walletAddress: string): Promise<boolean> => {
    if (!user?.email) {
      console.error("User not authenticated");
      return false;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("users")
        .update({
          wallet_address: walletAddress,
          updated_at: new Date().toISOString(),
        })
        .eq("email", user.email);

      if (error) {
        console.error("Error updating wallet:", error);
        return false;
      }

      // Atualizar perfil local
      if (profile) {
        setProfile({ ...profile, walletAddress });
      }

      console.log("Wallet connected successfully!");
      return true;
    } catch (error) {
      console.error("Error saving wallet address:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login com OAuth (Google/GitHub)
  const loginWithOAuth = async (provider: 'google' | 'github'): Promise<boolean> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error('Erro no login OAuth:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao fazer login OAuth:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login com email/senha
  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erro no login:', error);
        
        // Tratamento específico de erros
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Email ou senha incorretos' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Por favor, confirme seu email antes de fazer login' };
        }
        if (error.message.includes('Too many requests')) {
          return { success: false, error: 'Muitas tentativas de login. Tente novamente em alguns minutos' };
        }
        
        return { success: false, error: error.message || 'Erro no login' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { success: false, error: 'Erro inesperado no login' };
    } finally {
      setLoading(false);
    }
  };

  // Cadastro com email/senha
  const signUpWithEmail = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Validação frontend da senha
      if (password.length < 6) {
        return { success: false, error: 'A senha deve ter pelo menos 6 caracteres' };
      }
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (error) {
        console.error('Erro no cadastro:', error);
        
        // Tratamento específico de erros
        if (error.message.includes('Password should be at least 6 characters')) {
          return { success: false, error: 'A senha deve ter pelo menos 6 caracteres' };
        }
        if (error.message.includes('User already registered')) {
          return { success: false, error: 'Este email já está cadastrado' };
        }
        if (error.message.includes('Invalid email')) {
          return { success: false, error: 'Email inválido' };
        }
        
        return { success: false, error: error.message || 'Erro no cadastro' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao fazer cadastro:', error);
      return { success: false, error: 'Erro inesperado no cadastro' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setProfile(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    // Dados do usuário
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    
    // Métodos de autenticação
    loginWithOAuth,
    loginWithEmail,
    signUpWithEmail,
    logout,
    
    // Métodos de perfil
    updateWalletAddress,
    refreshProfile: () => user?.email ? loadUserProfile(user.email) : Promise.resolve(),
    
    // Cliente Supabase (se necessário para uso direto)
    supabase,
  };
}