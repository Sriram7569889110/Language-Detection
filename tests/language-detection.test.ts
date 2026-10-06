import assert from "node:assert/strict";
import test from "node:test";

import { detectLanguages } from "../lib/language-detection";

test("separates French and English without punctuation", () => {
  const result = detectLanguages("Je mange une pomme I eat an apple");
  const codes = result.languages.map((language) => language.code);

  assert.equal(result.total_languages, 2);
  assert.deepEqual(new Set(codes), new Set(["fr", "en"]));
  assert.deepEqual(
    result.segments.map((segment) => segment.code),
    ["fr", "en"],
  );
  assert.equal(codes.includes("de"), false);
  assert.equal(
    result.languages.reduce((sum, language) => sum + language.percentage, 0),
    100,
  );
});

test("keeps the existing English, Telugu, and Hindi detection", () => {
  const result = detectLanguages(
    "Welcome to our campus. మా కళాశాలకు స్వాగతం. हमारे परिसर में आपका स्वागत है।",
  );
  assert.deepEqual(
    new Set(result.languages.map((language) => language.code)),
    new Set(["en", "te", "hi"]),
  );
});

test("detects single-word French and English switches", () => {
  const result = detectLanguages("Bonjour hello");
  assert.deepEqual(
    result.segments.map((segment) => segment.code),
    ["fr", "en"],
  );
});
