import { NextResponse } from "next/server";
import { resolveToken } from "@/lib/tokens";
import { getSwapTransaction } from "@/lib/okx-dex";
import { toRawAmount } from "@/lib/amount";

export async function POST(req: Request) {
    try {
        const { fromToken, toToken, amount, userWalletAddress } = await req.json();

        if (!userWalletAddress) {
            return NextResponse.json({ error: "userWalletAddress is required" }, { status: 400 });
        }
        if (fromToken?.toUpperCase() === toToken?.toUpperCase()) {
            return NextResponse.json({ error: "Cannot swap a token for itself" }, { status: 400 });
        }
        if (!(amount > 0)) {
            return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
        }

        const from = resolveToken(fromToken);
        const to = resolveToken(toToken);
        const rawAmount = toRawAmount(amount, from.decimals);

        const swap = await getSwapTransaction(from.address, to.address, rawAmount, userWalletAddress);

        return NextResponse.json({
            swapTx: {
                to: swap.tx.to,
                data: swap.tx.data,
                value: swap.tx.value ?? "0",
                gasLimit: swap.tx.gasLimit ?? swap.tx.gas,
                gasPrice: swap.tx.gasPrice,
            },
        });
    } catch (err) {
        console.error("swap-tx error:", err);
        const message = err instanceof Error ? err.message : "Failed to fetch swap transaction.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}