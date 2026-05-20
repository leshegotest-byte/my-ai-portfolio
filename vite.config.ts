import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start-plugin";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Vercel deployment configuration for TanStack Start.
// The `target: "vercel"` tells Nitro (used internally by TanStack Start)
// to emit a Vercel-compatible build output under `.vercel/output`.
export default defineConfig({
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart({
      target: "vercel",
      customViteReactPlugin: true,
    }),
    viteReact(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"],
  },
});
