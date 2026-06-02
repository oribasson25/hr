export const COOKIE_NAME = "hr_session";
export const USERNAME = "misra-libra";
export const COOKIE_MAX_AGE = 60 * 60 * 2; // 2 hours
export const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

async function signPayload(payload: string): Promise<string> {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createToken(): Promise<string> {
  const ts = Date.now().toString();
  const sig = await signPayload(`hr-session-v1:${ts}`);
  return `${sig}:${ts}`;
}

export async function verifyToken(token: string): Promise<boolean> {
  // token format: 64-hex-sig:timestamp
  if (token.length < 66) return false;
  const sigPart = token.slice(0, 64);
  if (token[64] !== ":") return false;
  const tsPart = token.slice(65);
  if (!/^\d+$/.test(tsPart)) return false;

  const expected = await signPayload(`hr-session-v1:${tsPart}`);
  if (expected !== sigPart) return false;

  const loginTime = parseInt(tsPart, 10);
  return Date.now() - loginTime <= SESSION_DURATION_MS;
}
