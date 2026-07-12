import { NextResponse } from "next/server";
import { resolveToken, XLAYER_TOKENS } from "@/lib/tokens";
import { getApproveTransaction } from "@/lib/okx-dex";
import { toRawAmount } from "@/lib/amount";

const NATIVE_ADDRESS = XLAYER_TOKENS.OKB.address;

export async function POST(req: Request) {
    try {
        const { fromToken, amount } = await req.json();

        if (!(amount > 0)) {
            return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 });
        }

        const from = resolveToken(fromToken);
        const rawAmount = toRawAmount(amount, from.decimals);
        const isNative = from.address.toLowerCase() === NATIVE_ADDRESS.toLowerCase();

        if (isNative) {
            return NextResponse.json({
                isNative: true,
                approveTx: null,
                tokenAddress: from.address,
                requiredAmountRaw: rawAmount,
            });
        }

        const approve = await getApproveTransaction(from.address, rawAmount);

        return NextResponse.json({
            isNative: false,
            approveTx: {
                to: from.address, // approve() is called ON the token contract itself
                data: approve.data,
                spender: approve.dexContractAddress,
                gasLimit: approve.gasLimit,
                gasPrice: approve.gasPrice,
            },
            tokenAddress: from.address,
            requiredAmountRaw: rawAmount,
        });
    } catch (err) {
        console.error("prepare-approval error:", err);
        const message = err instanceof Error ? err.message : "Failed to prepare approval.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}