export type MetaConnection = {
  token: string;
  appId?: string;
  appSecret?: string;
};

export function readMetaConnection(value: unknown): MetaConnection | null {
  if (typeof value === "string" && value.trim()) return { token: value.trim() };
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.token !== "string" || !candidate.token.trim()) return null;
  return {
    token: candidate.token.trim(),
    appId: typeof candidate.appId === "string" ? candidate.appId.trim() : undefined,
    appSecret: typeof candidate.appSecret === "string" ? candidate.appSecret.trim() : undefined,
  };
}

export function getMetaConnection(apiKeys: unknown, preferred: "instagram" | "facebook" = "instagram") {
  if (!apiKeys || typeof apiKeys !== "object") return null;
  const keys = apiKeys as Record<string, unknown>;
  return readMetaConnection(keys[preferred]) || readMetaConnection(keys[preferred === "instagram" ? "facebook" : "instagram"]);
}
