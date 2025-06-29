// ==================================================================================
// Módulo: Auth Callback Page
// Localização: /frontend/app/auth/callback/page.tsx
// ==================================================================================

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Erro no callback:", error);
          router.push("/login?error=callback_error");
          return;
        }

        if (data.session) {
          console.log("✅ Login realizado com sucesso!");
          router.push("/dashboard");
        } else {
          console.log("❌ Sessão não encontrada");
          router.push("/login?error=no_session");
        }
      } catch (error) {
        console.error("Erro no callback:", error);
        router.push("/login?error=callback_error");
      }
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Finalizando login...</p>
      </div>
    </div>
  );
}
