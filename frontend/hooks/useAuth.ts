// hooks/useAuth.ts
// ✅ HOOK USEAUTH CORRIGIDO

import { useSession, signIn, signOut } from "next-auth/react";
import { useSupabase } from "@/app/api/auth/providers";
import { useState, useEffect } from "react";

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
  const { data: session, status } = useSession();
  const supabase = useSupabase();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  // Carregar perfil do usuário do Supabase
  useEffect(() => {
    if (session?.user?.email && status === "authenticated") {
      loadUserProfile();
    }
  }, [session, status]);

  const loadUserProfile = async () => {
    if (!session?.user?.email) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", session.user.email)
        .single();

      if (error) {
        console.error("Erro ao carregar perfil:", error);
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
      console.error("Erro ao carregar perfil do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateWalletAddress = async (walletAddress: string) => {
    if (!session?.user?.email) {
      console.error("Usuário não autenticado");
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
        .eq("email", session.user.email);

      if (error) {
        console.error("Erro ao atualizar wallet:", error);
        return false;
      }

      // Atualizar perfil local
      if (profile) {
        setProfile({ ...profile, walletAddress });
      }

      console.log("Carteira conectada com sucesso!");
      return true;
    } catch (error) {
      console.error("Erro ao salvar endereço da carteira:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = () => signIn()
  const logout = () => signOut()

  return {
    // Dados do usuário
    user: session?.user || null,
    profile,
    loading,
    isAuthenticated: !!session?.user,
    
    // Métodos
    login,
    logout,
    updateWalletAddress,
    loadUserProfile,
    
    // Status
    status,
  }
}