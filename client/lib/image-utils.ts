import { getApiUrl } from "./query-client";

export function getImageUrl(relativePath: string): string {
  if (!relativePath) return "";
  if (relativePath.startsWith("http://") || relativePath.startsWith("https://")) {
    return relativePath;
  }
  const baseUrl = getApiUrl();
  return `${baseUrl.replace(/\/$/, "")}${relativePath}`;
}
