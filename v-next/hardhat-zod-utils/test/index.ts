import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { z } from "zod";

import { unionType, conditionalUnionType } from "../src/index.js";

function assertParseResult(
  result: z.SafeParseReturnType<any, any>,
  expectedMessage: string,
  path?: Array<string | number>,
) {
  assert.equal(result.error?.errors.length, 1);
  assert.equal(result.error?.errors[0].message, expectedMessage);

  if (path !== undefined) {
    assert.deepEqual(result.error?.errors[0].path, path);
  }
}

describe("unionType", () => {
  it("It should return the expected error message", function () {
    const union = unionType(
      [z.object({ a: z.string() }), z.object({ b: z.string() })],
      "Expected error message",
    );

    assertParseResult(
      union.safeParse({ a: 123, c: 123 }),
      "Expected error message",
    );

    assertParseResult(union.safeParse(123), "Expected error message");

    assertParseResult(union.safeParse({}), "Expected error message");

    assertParseResult(union.safeParse(undefined), "Expected error message");
  });
});

describe("conditionalUnionType", () => {
  describe("Conditions evaluation", () => {
    it("should return the first type that matches", async () => {
      const shouldUseString = conditionalUnionType(
        [
          [(data) => typeof data === "string", z.string()],
          [(data) => typeof data === "string", z.string().url()],
        ],
        "No match",
      );

      // Both conditions match, but we only use the first one
      assert.equal(shouldUseString.safeParse("asd").success, true);

      const shouldUseUrl = conditionalUnionType(
        [
          [(data) => typeof data === "string", z.string().url()],
          [(data) => typeof data === "string", z.string()],
        ],
        "No match",
      );

      assertParseResult(shouldUseUrl.safeParse("asd"), "Invalid url");
    });

    it("should return the provided error message if no condition matches", async () => {
      const shouldUseString = conditionalUnionType(
        [
          [(data) => typeof data === "string", z.string()],
          [(data) => typeof data === "string", z.string().url()],
        ],
        "No match",
      );

      // Both conditions match, but we only use the first one
      assertParseResult(shouldUseString.safeParse(123), "No match");
    });
  });

  describe("Zod issues paths", () => {
    it("should have an empty path when nothing matches in as a top-level type", async () => {
      const shouldUseString = conditionalUnionType(
        [
          [(data) => typeof data === "string", z.string()],
          [(data) => typeof data === "string", z.string().url()],
        ],
        "No match",
      );

      assertParseResult(shouldUseString.safeParse(123), "No match", []);
    });

    it("Should have the path to the nested error if a condition matches", () => {
      const shouldUseString = conditionalUnionType(
        [
          [(data) => typeof data === "object", z.object({ foo: z.string() })],
          [(data) => typeof data === "string", z.string().url()],
        ],
        "No match",
      );

      assertParseResult(
        shouldUseString.safeParse({ foo: 123 }),
        "Expected string, received number",
        ["foo"],
      );
    });

    it("Should have the path to the nested error, even if it's also a conditional union type", () => {
      const shouldUseString = conditionalUnionType(
        [
          [(data) => typeof data === "string", z.string()],
          [
            (data) => typeof data === "object",
            conditionalUnionType(
              [
                [
                  (data) =>
                    typeof data === "object" && data !== null && "foo" in data,
                  z.object({ foo: z.string().url() }),
                ],
                [
                  (data) =>
                    typeof data === "object" && data !== null && "bar" in data,
                  z.object({ bar: z.array(z.number()) }),
                ],
              ],
              "No internal match",
            ),
          ],
        ],
        "No outer match",
      );

      assertParseResult(shouldUseString.safeParse(123), "No outer match", []);

      assertParseResult(shouldUseString.safeParse({}), "No internal match", []);

      assertParseResult(
        shouldUseString.safeParse({ foo: "asd" }),
        "Invalid url",
        ["foo"],
      );

      assertParseResult(
        shouldUseString.safeParse({ bar: "asd" }),
        "Expected array, received string",
        ["bar"],
      );

      assertParseResult(
        shouldUseString.safeParse({ bar: ["asd"] }),
        "Expected number, received string",
        ["bar", 0],
      );
    });
  });
});
