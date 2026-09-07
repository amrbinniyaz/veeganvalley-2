import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  server: { host: "0.0.0.0", port: 3003, open: true },
  build: {
    target: "es2020",
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        journey: fileURLToPath(new URL("./farm-to-bottle/index.html", import.meta.url)),
        world: fileURLToPath(new URL("./3d-journey/index.html", import.meta.url)),
      },
    },
  },
});
