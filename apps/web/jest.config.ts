import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jest-environment-jsdom",
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
    "!src/lib/api-endpoints.ts",
    "!src/lib/constants.ts",
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
