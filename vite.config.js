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
        home2: fileURLToPath(new URL("./home-2/index.html", import.meta.url)),
        journey: fileURLToPath(new URL("./farm-to-bottle/index.html", import.meta.url)),
        meals: fileURLToPath(new URL("./meal-plans/index.html", import.meta.url)),
        menu: fileURLToPath(new URL("./menu/index.html", import.meta.url)),
        world: fileURLToPath(new URL("./3d-journey/index.html", import.meta.url)),
      },
    },
  },
});
