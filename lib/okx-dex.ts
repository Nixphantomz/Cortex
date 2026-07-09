import crypto from "crypto";

const BASE_URL = "https://web3.okx.com";
const CHAIN_INDEX = "196"; // X Layer mainnet — OKX's DEX aggregator has no testnet liquidity

function sign(timestamp: string, method: string, requestPath: string, body = ""): string {
  const prehash = timestamp + method + requestPath + body;
  return crypto.createHmac("sha256", process.env.OKX_SECRET_KEY!).update(prehash).digest("base64");
}

function buildHeaders(timestamp: string, method: string, requestPath: string, body = "") {
  return {
    "OK-ACCESS-KEY": process.env.OKX_API_KEY!,
    "OK-ACCESS-SIGN": sign(timestamp, method, requestPath, body),
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": process.env.OKX_API_PASSPHRASE!,
    "OK-ACCESS-PROJECT": process.env.OKX_PROJECT_ID!,
    "Content-Type": "application/json",
  };
}

function assertCredentials() {
  const missing = ["OKX_API_KEY", "OKX_SECRET_KEY", "OKX_API_PASSPHRASE", "OKX_PROJECT_ID"].filter(
    (key) => !process.env[key]
  );
  if (missing.length) {
    throw new Error(`Missing OKX API credentials in .env.local: ${missing.join(", ")}`);
  }
}

/**
 * Fetches a swap quote from OKX's DEX aggregator (real liquidity, real prices).
 * Response schema follows OKX's documented quote format — if fields look
 * different than expected, log the raw response and adjust the field
 * names below rather than guessing further.
 */
export async function getSwapQuote(fromAddress: string, toAddress: string, amountRaw: string) {
  assertCredentials();

  const path = "/api/v6/dex/aggregator/quote";
  const params = new URLSearchParams({
    chainIndex: CHAIN_INDEX,
    fromTokenAddress: fromAddress,
    toTokenAddress: toAddress,
    amount: amountRaw,
    slippagePercent: "0.5",
  });
  const requestPath = `${path}?${params.toString()}`;
  const timestamp = new Date().toISOString();

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${requestPath}`, {
      headers: buildHeaders(timestamp, "GET", requestPath),
    });
  } catch (err) {
    // "fetch failed" alone hides the real reason — Node attaches it to .cause
    const cause = err instanceof Error && "cause" in err ? err.cause : undefined;
    console.error("OKX fetch network failure. Cause:", cause ?? err);
    throw new Error(
      `Could not reach OKX's API (network-level failure). Cause: ${
        cause instanceof Error ? cause.message : String(cause ?? err)
      }`
    );
  }

  if (!res.ok) {
    throw new Error(`OKX quote request failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  if (json.code !== "0") {
    throw new Error(`OKX quote error (${json.code}): ${json.msg}`);
  }

  return json.data[0];
}

/**
 * Fetches real swap transaction calldata (to, data, value, gas) ready to
 * be signed by the user's wallet. Not wired to the UI yet — that's the
 * next step once quotes are verified to look right.
 */
export async function getSwapTransaction(
  fromAddress: string,
  toAddress: string,
  amountRaw: string,
  userWalletAddress: string
) {
  assertCredentials();

  const path = "/api/v6/dex/aggregator/swap";
  const params = new URLSearchParams({
    chainIndex: CHAIN_INDEX,
    fromTokenAddress: fromAddress,
    toTokenAddress: toAddress,
    amount: amountRaw,
    userWalletAddress,
    slippagePercent: "0.5",
  });
  const requestPath = `${path}?${params.toString()}`;
  const timestamp = new Date().toISOString();

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${requestPath}`, {
      headers: buildHeaders(timestamp, "GET", requestPath),
    });
  } catch (err) {
    const cause = err instanceof Error && "cause" in err ? err.cause : undefined;
    console.error("OKX fetch network failure. Cause:", cause ?? err);
    throw new Error(
      `Could not reach OKX's API (network-level failure). Cause: ${
        cause instanceof Error ? cause.message : String(cause ?? err)
      }`
    );
  }

  if (!res.ok) {
    throw new Error(`OKX swap request failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  if (json.code !== "0") {
    throw new Error(`OKX swap error (${json.code}): ${json.msg}`);
  }

  return json.data[0]; // includes a `tx` object: { to, data, value, gasLimit, gasPrice }
}

/**
 * Fetches ERC-20 approval calldata for a given token + amount. Only needed
 * for ERC-20 fromTokens — native OKB never needs approval. Per OKX's own
 * guidance, the spender address (dexContractAddress) is NOT hardcoded here
 * since it can change on contract upgrades — always use what this endpoint
 * returns fresh, each time.
 */
export async function getApproveTransaction(tokenContractAddress: string, approveAmountRaw: string) {
  assertCredentials();

  const path = "/api/v6/dex/aggregator/approve-transaction";
  const params = new URLSearchParams({
    chainIndex: CHAIN_INDEX,
    tokenContractAddress,
    approveAmount: approveAmountRaw,
  });
  const requestPath = `${path}?${params.toString()}`;
  const timestamp = new Date().toISOString();

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${requestPath}`, {
      headers: buildHeaders(timestamp, "GET", requestPath),
    });
  } catch (err) {
    const cause = err instanceof Error && "cause" in err ? err.cause : undefined;
    console.error("OKX fetch network failure. Cause:", cause ?? err);
    throw new Error(
      `Could not reach OKX's API (network-level failure). Cause: ${
        cause instanceof Error ? cause.message : String(cause ?? err)
      }`
    );
  }

  if (!res.ok) {
    throw new Error(`OKX approve-transaction request failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  if (json.code !== "0") {
    throw new Error(`OKX approve-transaction error (${json.code}): ${json.msg}`);
  }

  return json.data[0]; // { data, dexContractAddress, gasLimit, gasPrice }
}