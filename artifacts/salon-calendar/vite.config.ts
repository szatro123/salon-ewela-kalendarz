import { defineConfig } from "vite";

const rawPort = process.env.PORT;
if (!rawPort) throw new Error("PORT environment variable is required");
const port = Number(rawPort);

const basePath = process.env.BASE_PATH;
if (!basePath) throw new Error("BASE_PATH environment variable is required");

export default defineConfig({
  base: basePath,
  root: new URL(".", import.meta.url).pathname,
  build: {
    outDir: new URL("dist/public", import.meta.url).pathname,
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
