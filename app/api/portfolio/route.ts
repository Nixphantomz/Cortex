import { NextResponse } from "next/server";
import { getPortfolio } from "@/lib/agent/portfolio";

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();
    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress is required" }, { status: 400 });
    }

    const portfolio = await getPortfolio(walletAddress);
    return NextResponse.json(portfolio);
  } catch (err) {
    console.error("Portfolio route error:", err);
    return NextResponse.json({ error: "Failed to load portfolio" }, { status: 500 });
  }
}