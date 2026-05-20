import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Vercel deployment configuration for TanStack Start.
// The Nitro build target is selected via the NITRO_PRESET=vercel env var,
// which Vercel sets automatically; locally, vercel.json's build command sets it too.
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    // @ts-expect-error - `target` is accepted by the underlying nitro options but not surfaced on the input type
    tanstackStart({ target: "vercel" }),
    viteReact(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"],
  },
});
