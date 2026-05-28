export const COOKIE_NAME = "hr_session";
export const USERNAME = "misra-libra";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function computeToken(): Promise<string> {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode("hr-session-v1"));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
