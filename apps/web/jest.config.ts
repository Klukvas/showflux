import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/**/__tests__/**/*.spec.{ts,tsx}"],
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/hooks/**/*.ts",
    "src/components/**/*.tsx",
    "src/features/auth/**/*.tsx",
    "src/features/dashboard/**/*.tsx",
    "src/features/listings/**/*.tsx",
    "src/features/team/**/*.tsx",
    "!src/features/auth/auth-context.tsx",
    "!src/features/auth/auth-provider.tsx",
    "!src/features/auth/components/accept-invite-form.tsx",
    "!src/features/auth/components/reset-password-form.tsx",
    "!src/features/listings/components/listing-table.tsx",
    "!src/features/team/components/invite-table.tsx",
    "!src/lib/api-endpoints.ts",
    "!src/lib/constants.ts",
    "!src/lib/blog.ts",
    "!src/types/**",
    "!src/app/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
