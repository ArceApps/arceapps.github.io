/**
 * Optimizes Google Play image URLs by appending size parameters.
 * @param url The original image URL.
 * @param size The desired size (width or longest edge).
 * @param type 'width' (w) or 'square' (s). Defaults to 'width'.
 * @returns The optimized URL.
 */
export function optimizeGooglePlayImage(
  url: string | undefined,
  size: number,
  type: "width" | "square" = "width"
): string | undefined {
  if (!url) return undefined;

  // Check if it's a Google Play or Google User Content URL
  if (
    !url.includes("googleusercontent.com") &&
    !url.includes("ggpht.com") // Legacy domain
  ) {
    return url;
  }

  // Remove existing size parameters (everything after the last '=')
  // Google Play URLs typically look like: https://.../ID=w500-h300
  // or https://.../ID
  // We want to keep the ID part.
  const baseUrl = url.split("=")[0];

  const param = type === "square" ? "s" : "w";
  return `${baseUrl}=${param}${size}`;
}
