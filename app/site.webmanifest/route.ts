/**
 * Serves the web app manifest with correct Content-Type.
 * Fixes "Manifest: Line 1, column 1, Syntax error" when the host
 * serves the static file with wrong or missing content type.
 */
export const dynamic = "force-static";

const manifest = {
  name: "Kleine Koning - Tijdregistratie",
  short_name: "Kleine Koning",
  id: "/",
  start_url: "/",
  icons: [
    {
      src: "/android-chrome-192x192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/android-chrome-512x512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
  theme_color: "#ffffff",
  background_color: "#ffffff",
  display: "standalone",
} as const;

export function GET() {
  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
