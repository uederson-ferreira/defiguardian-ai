// app/api/user/wallet/route.ts
// API PARA SALVAR ENDEREÇO DA WALLET NO SUPABASE

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/server-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verificar se usuário está autenticado
    const user = await getAuthUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Extrair dados do request
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Endereço da wallet é obrigatório" },
        { status: 400 }
      );
    }

    // Validar formato do endereço Ethereum
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethereumAddressRegex.test(walletAddress)) {
      return NextResponse.json(
        { error: "Endereço da wallet inválido" },
        { status: 400 }
      );
    }

    console.log("💳 Salvando wallet para usuário:", user.email);

    // Atualizar endereço da wallet no Supabase
    const { data, error } = await supabase
      .from("users")
      .update({
        wallet_address: walletAddress,
        updated_at: new Date().toISOString(),
      })
      .eq("email", user.email)
      .select("*");

    if (error) {
      console.error("❌ Erro ao salvar wallet no Supabase:", error);
      return NextResponse.json(
        { error: "Erro ao salvar wallet no banco de dados" },
        { status: 500 }
      );
    }

    console.log("✅ Wallet salva com sucesso:", data);

    return NextResponse.json({
      success: true,
      message: "Wallet salva com sucesso",
      wallet_address: walletAddress,
      user_data: data,
    });
  } catch (error) {
    console.error("❌ Erro na API de wallet:", error);

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Verificar se usuário está autenticado
    const user = await getAuthUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Buscar dados do usuário incluindo wallet
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", user.email)
      .single();

    if (error) {
      console.error("❌ Erro ao buscar dados do usuário:", error);
      return NextResponse.json(
        { error: "Erro ao buscar dados do usuário" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user_data: data,
      wallet_address: data?.wallet_address || null,
    });
  } catch (error) {
    console.error("❌ Erro na API de wallet GET:", error);

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
