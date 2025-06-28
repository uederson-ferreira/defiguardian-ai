// app/api/auth/[...nextauth]/route.ts
// ✅ NEXTAUTH COM LOGIN COMPLETO VIA EMAIL/SENHA

import NextAuth from "next-auth/next";
import { authOptions } from "@/lib/auth-config";

console.log("🚀 Configurando NextAuth com login completo...");

// Criar handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = NextAuth(authOptions as any);

console.log("✅ NextAuth configurado com login completo!");

export { handler as GET, handler as POST };
