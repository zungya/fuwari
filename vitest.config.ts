import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@components": "/src/components",
      "@assets": "/src/assets",
      "@constants": "/src/constants",
      "@utils": "/src/utils",
      "@i18n": "/src/i18n",
      "@layouts": "/src/layouts",
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
