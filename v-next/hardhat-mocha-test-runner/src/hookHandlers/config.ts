import type { ConfigHooks } from "@ignored/hardhat-vnext/types/hooks";

import {
  unionType,
  validateUserConfigZodType,
} from "@ignored/hardhat-vnext-zod-utils";
import { z } from "zod";

const mochaConfigType = z.object({
  allowUncaught: z.boolean().optional(),
  asyncOnly: z.boolean().optional(),
  bail: z.boolean().optional(),
  checkLeaks: z.boolean().optional(),
  color: z.boolean().optional(),
  delay: z.boolean().optional(),
  diff: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  failZero: z.boolean().optional(),
  fgrep: z.string().optional(),
  forbidOnly: z.boolean().optional(),
  forbidPending: z.boolean().optional(),
  fullTrace: z.boolean().optional(),
  globals: z.array(z.string()).optional(),
  grep: z.string().optional(),
  growl: z.boolean().optional(),
  inlineDiffs: z.boolean().optional(),
  invert: z.boolean().optional(),
  noHighlighting: z.boolean().optional(),
  reporter: z.string().optional(),
  reporterOptions: z.any().optional(),
  retries: z.number().optional(),
  slow: z.number().optional(),
  timeout: unionType(
    [z.number(), z.string()],
    "Expected a number or a string",
  ).optional(),
  ui: unionType(
    [
      z.literal("bdd"),
      z.literal("tdd"),
      z.literal("qunit"),
      z.literal("exports"),
    ],
    'Expected "bdd", "tdd", "qunit" or "exports"',
  ).optional(),
  parallel: z.boolean().optional(),
  jobs: z.number().optional(),
  rootHooks: z
    .object({
      afterAll: unionType(
        [z.function(), z.array(z.function())],
        "Expected a function or an array of functions",
      ).optional(),
      beforeAll: unionType(
        [z.function(), z.array(z.function())],
        "Expected a function or an array of functions",
      ).optional(),
      afterEach: unionType(
        [z.function(), z.array(z.function())],
        "Expected a function or an array of functions",
      ).optional(),
      beforeEach: unionType(
        [z.function(), z.array(z.function())],
        "Expected a function or an array of functions",
      ).optional(),
    })
    .optional(),
  require: z.array(z.string()).optional(),
  isWorker: z.boolean().optional(),
});

const userConfigType = z.object({
  mocha: z.optional(mochaConfigType),
});

export default async (): Promise<Partial<ConfigHooks>> => {
  const handlers: Partial<ConfigHooks> = {
    validateUserConfig: async (userConfig) => {
      return validateUserConfigZodType(userConfig, userConfigType);
    },
    resolveUserConfig: async (
      userConfig,
      resolveConfigurationVariable,
      next,
    ) => {
      const resolvedConfig = await next(
        userConfig,
        resolveConfigurationVariable,
      );

      return {
        ...resolvedConfig,
        mocha: {
          timeout: 40000,
          ...resolvedConfig.mocha,
          ...userConfig.mocha,
        },
      };
    },
  };

  return handlers;
};