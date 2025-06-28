import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions = {
  providers: [
    // 1. Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // 2. GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),

    // 3. ✅ Credentials COMPLETO (Cadastro + Login)
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        action: { label: "Action", type: "text" },
        name: { label: "Nome", type: "text" },
      },
      async authorize(credentials) {
        console.log("🔑 Processando credenciais:", {
          email: credentials?.email,
          action: credentials?.action,
        });

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const { email, password, action, name } = credentials;

        try {
          if (action === "signup") {
            // ===== CADASTRO =====
            console.log("📝 Criando novo usuário...");

            if (!name?.trim()) {
              throw new Error("Name is required for registration");
            }

            // Verificar se usuário já existe
            const { data: existingUser } = await supabase
              .from("users")
              .select("id, email")
              .eq("email", email)
              .single();

            if (existingUser) {
              throw new Error("Email already registered");
            }

            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 12);

            // Criar usuário
            const { data: newUser, error: userError } = await supabase
              .from("users")
              .insert({
                email,
                name,
                provider: "credentials",
                provider_id: email,
              })
              .select()
              .single();

            if (userError) {
              console.error("❌ Error creating user:", userError);
              throw new Error("Error creating user: " + userError.message);
            }

            // Salvar senha na tabela separada
            const { error: passwordError } = await supabase
              .from("user_passwords")
              .insert({
                user_id: newUser.id,
                password_hash: hashedPassword,
              });

            if (passwordError) {
              console.error("❌ Error saving password:", passwordError);
              // Remover usuário se der erro na senha
              await supabase.from("users").delete().eq("id", newUser.id);

              throw new Error("Error saving password");
            }

            console.log("✅ Usuário criado com sucesso:", newUser.email);

            return {
              id: newUser.id.toString(),
              email: newUser.email as string,
              name: newUser.name || "",
              image: newUser.image || null,
            };
          } else {
            // ===== LOGIN =====
            console.log("🔓 Fazendo login via email...");

            // Buscar usuário
            const { data: user, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("email", email)
              .eq("provider", "credentials")
              .single();

            if (userError || !user) {
              console.error("❌ User not found:", userError);
              throw new Error(
                "Email not found. Check your email or create an account."
              );
            }

            // Buscar senha
            const { data: passwordData, error: passwordError } = await supabase
              .from("user_passwords")
              .select("password_hash")
              .eq("user_id", user.id)
              .single();

            if (passwordError || !passwordData) {
              console.error("❌ Password not found:", passwordError);
              throw new Error("Invalid login credentials");
            }

            // Verificar senha
            const isValidPassword = await bcrypt.compare(
              password,
              passwordData.password_hash
            );
            if (!isValidPassword) {
              console.error("❌ Incorrect password");
              throw new Error("Incorrect password");
            }

            console.log("✅ Login realizado com sucesso:", user.email);

            return {
              id: user.id.toString(),
              email: user.email as string,
              name: user.name || "",
              image: user.image || null,
            };
          }
        } catch (error) {
          console.error("❌ Authentication error:", error);
          throw error;
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }: { user: User; account: { provider?: string; providerAccountId?: string } | null }) {
      try {
        if (account?.provider === "google" || account?.provider === "github") {
          // Verificar se usuário já existe
          if (!user.email) {
            console.error("❌ User email is required for OAuth");
            return false;
          }

          const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("email", user.email)
            .single();

          if (!existingUser) {
            // Criar novo usuário OAuth
            const { error } = await supabase.from("users").insert({
              email: user.email,
              name: user.name || "",
              avatar_url: user.image || "",
              provider: account.provider,
              provider_id: account.providerAccountId,
              created_at: new Date().toISOString(),
            });

            if (error) {
              console.error("❌ Error creating OAuth user:", error);
              return false;
            }
          }
        }
        return true;
      } catch (error) {
        console.error("❌ SignIn callback error:", error);
        return false;
      }
    },

    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development",
};
