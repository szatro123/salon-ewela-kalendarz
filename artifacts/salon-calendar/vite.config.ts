
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  root: new URL(".", import.meta.url).pathname,
  build: {
    outDir: new URL("dist/public", import.meta.url).pathname,
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  preview: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
