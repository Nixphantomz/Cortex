import { NextResponse } from "next/server";
import { resolveToken, XLAYER_TOKENS } from "@/lib/tokens";
import { getSwapTransaction, getApproveTransaction } from "@/lib/okx-dex";
import { toRawAmount } from "@/lib/amount";

const NATIVE_ADDRESS = XLAYER_TOKENS.OKB.address;

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
    const isNative = from.address.toLowerCase() === NATIVE_ADDRESS.toLowerCase();

    // Native OKB never needs approval — only ERC-20 fromTokens do.
    let approveTx = null;
    if (!isNative) {
      const approve = await getApproveTransaction(from.address, rawAmount);
      approveTx = {
        to: from.address, // approve() is called ON the token contract itself
        data: approve.data,
        spender: approve.dexContractAddress, // used by the client to check current allowance first
        gasLimit: approve.gasLimit,
        gasPrice: approve.gasPrice,
      };
    }

    const swap = await getSwapTransaction(from.address, to.address, rawAmount, userWalletAddress);

    return NextResponse.json({
      isNative,
      approveTx,
      swapTx: {
        to: swap.tx.to,
        data: swap.tx.data,
        value: swap.tx.value ?? "0",
        gasLimit: swap.tx.gasLimit ?? swap.tx.gas,
        gasPrice: swap.tx.gasPrice,
      },
      tokenAddress: from.address, // needed client-side for the allowance check
      requiredAmountRaw: rawAmount,
    });
  } catch (err) {
    console.error("prepare-swap error:", err);
    const message = err instanceof Error ? err.message : "Failed to prepare swap transaction.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}