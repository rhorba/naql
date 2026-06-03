import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/web/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "packages/core/src/**/*.ts",
        "packages/billing/src/**/*.ts",
        "packages/payroll/src/**/*.ts",
        "packages/ocr/src/**/*.ts",
        "packages/notifications/src/**/*.ts",
        "apps/web/src/lib/**/*.ts",
      ],
      exclude: [
        "**/__tests__/**",
        "**/*.test.ts",
        "**/index.ts",
        "**/*.d.ts",
        "**/node_modules/**",
        // Pure TypeScript type definitions — no executable runtime code
        "packages/core/src/types.ts",
        "packages/core/src/schemas.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
