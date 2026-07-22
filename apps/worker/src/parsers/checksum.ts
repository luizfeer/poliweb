export async function checksumFor(parts: string[]): Promise<string> {
  const normalized = parts.map((part) => part.trim()).join("\n---\n")
  const bytes = new TextEncoder().encode(normalized)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")
}
