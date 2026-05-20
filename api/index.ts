// Vercel serverless function that wraps the TanStack Start SSR handler.
// Vite builds the SSR bundle to dist/server/server.js (default export is
// `{ fetch(request, env, ctx) }`). Vercel routes all non-static requests
// here via vercel.json rewrites.
import handler from "../dist/server/server.js";

export const config = {
  runtime: "nodejs",
};

export default async function vercelHandler(request: Request): Promise<Response> {
  return handler.fetch(request, process.env as unknown as Record<string, string>, {});
}
