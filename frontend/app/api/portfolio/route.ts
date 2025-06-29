// app/api/portfolio/route.ts
// API PARA GERENCIAR PORTFOLIOS - CORRIGIDA COM TIPAGEM

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/server-auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Interfaces para tipagem
interface PositionRecord {
  id: string;
  portfolio_id: string;
  protocol: string;
  token_symbol: string;
  value_usd: number;
  apy: number | null;
  risk_level: string;
  created_at: string;
  updated_at: string;
}

interface PortfolioRecord {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  wallet_address: string;
  total_value: number;
  risk_score: number;
  created_at: string;
  updated_at: string;
  positions?: PositionRecord[];
}

interface PortfolioWithStats extends PortfolioRecord {
  calculated_total_value: number;
  average_apy: number;
  position_count: number;
}

// GET - Buscar portfolios do usuário
export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Buscar usuário
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Buscar portfolios com posições
    const { data: portfolios, error: portfoliosError } = await supabase
      .from("portfolios")
      .select(
        `
        *,
        positions(*)
      `
      )
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false });

    if (portfoliosError) {
      console.error("❌ Error fetching portfolios:", portfoliosError);
      return NextResponse.json(
        { error: "Error fetching portfolios" },
        { status: 500 }
      );
    }

    // Calcular estatísticas - COM TIPAGEM CORRETA
    const portfoliosWithStats: PortfolioWithStats[] =
      (portfolios as PortfolioRecord[])?.map((portfolio: PortfolioRecord) => {
        const positions = portfolio.positions || [];
        const totalValue = positions.reduce(
          (sum: number, pos: PositionRecord) => sum + Number(pos.value_usd),
          0
        );
        const avgApy =
          positions.length > 0
            ? positions.reduce(
                (sum: number, pos: PositionRecord) =>
                  sum + (Number(pos.apy) || 0),
                0
              ) / positions.length
            : 0;

        return {
          ...portfolio,
          calculated_total_value: totalValue,
          average_apy: avgApy,
          position_count: positions.length,
        };
      }) || [];

    return NextResponse.json({
      success: true,
      portfolios: portfoliosWithStats,
    });
  } catch (error) {
    console.error("❌ Error in portfolios GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Criar novo portfolio
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user?.email) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { name, description, walletAddress } = await request.json();

    if (!name || !walletAddress) {
      return NextResponse.json(
        { error: "Name and wallet address are required" },
        { status: 400 }
      );
    }

    // Validar endereço Ethereum
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethereumAddressRegex.test(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Buscar usuário
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Criar portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .insert([
        {
          user_id: userData.id,
          name,
          description: description || null,
          wallet_address: walletAddress,
          total_value: 0,
          risk_score: 0,
        },
      ])
      .select("*")
      .single();

    if (portfolioError) {
      console.error("❌ Error creating portfolio:", portfolioError);
      return NextResponse.json(
        { error: "Error creating portfolio" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Portfolio criado com sucesso",
      portfolio: portfolio as PortfolioRecord,
    });
  } catch (error) {
    console.error("❌ Error in portfolios POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
