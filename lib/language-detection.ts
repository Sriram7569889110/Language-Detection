import { francAll } from "franc-min";
import { detectAll as detectAllTiny } from "tinyld";

export type LanguageBreakdown = {
  name: string;
  code: string;
  percentage: number;
  confidence: number;
  character_count: number;
  word_count: number;
};

export type SegmentBreakdown = {
  text: string;
  language: string;
  code: string;
  confidence: number;
};

export type DetectionResponse = {
  source_name: string;
  total_languages: number;
  character_count: number;
  word_count: number;
  languages: LanguageBreakdown[];
  segments: SegmentBreakdown[];
  analyzed_at: string;
};

const LANGUAGE_META: Record<string, { code: string; name: string }> = {
  eng: { code: "en", name: "English" },
  tel: { code: "te", name: "Telugu" },
  hin: { code: "hi", name: "Hindi" },
  mar: { code: "mr", name: "Marathi" },
  nep: { code: "ne", name: "Nepali" },
  tam: { code: "ta", name: "Tamil" },
  kan: { code: "kn", name: "Kannada" },
  mal: { code: "ml", name: "Malayalam" },
  ben: { code: "bn", name: "Bengali" },
  guj: { code: "gu", name: "Gujarati" },
  pan: { code: "pa", name: "Punjabi" },
  urd: { code: "ur", name: "Urdu" },
  arb: { code: "ar", name: "Arabic" },
  ara: { code: "ar", name: "Arabic" },
  spa: { code: "es", name: "Spanish" },
  fra: { code: "fr", name: "French" },
  deu: { code: "de", name: "German" },
  ita: { code: "it", name: "Italian" },
  por: { code: "pt", name: "Portuguese" },
  nld: { code: "nl", name: "Dutch" },
  swe: { code: "sv", name: "Swedish" },
  dan: { code: "da", name: "Danish" },
  nor: { code: "no", name: "Norwegian" },
  fin: { code: "fi", name: "Finnish" },
  rus: { code: "ru", name: "Russian" },
  ukr: { code: "uk", name: "Ukrainian" },
  pol: { code: "pl", name: "Polish" },
  ces: { code: "cs", name: "Czech" },
  ron: { code: "ro", name: "Romanian" },
  hun: { code: "hu", name: "Hungarian" },
  tur: { code: "tr", name: "Turkish" },
  ell: { code: "el", name: "Greek" },
  heb: { code: "he", name: "Hebrew" },
  jpn: { code: "ja", name: "Japanese" },
  kor: { code: "ko", name: "Korean" },
  cmn: { code: "zh", name: "Chinese" },
  zho: { code: "zh", name: "Chinese" },
  vie: { code: "vi", name: "Vietnamese" },
  ind: { code: "id", name: "Indonesian" },
  msa: { code: "ms", name: "Malay" },
  tha: { code: "th", name: "Thai" },
};

const LANGUAGE_META_BY_ISO2 = Object.fromEntries(
  Object.values(LANGUAGE_META).map((language) => [language.code, language]),
) as Record<string, { code: string; name: string }>;

/*
 * TinyLD supplies trained n-gram language profiles. These marker dictionaries
 * provide strong word-level anchors so a single Latin-script sentence can be
 * split when the writer switches languages without punctuation.
 */
const LATIN_MARKERS: Record<string, Set<string>> = {
  en: new Set([
    "a",
    "about",
    "an",
    "and",
    "apple",
    "are",
    "campus",
    "can",
    "content",
    "document",
    "eat",
    "english",
    "for",
    "from",
    "has",
    "have",
    "hello",
    "i",
    "in",
    "is",
    "it",
    "language",
    "my",
    "of",
    "on",
    "our",
    "please",
    "project",
    "student",
    "text",
    "that",
    "the",
    "their",
    "this",
    "to",
    "we",
    "welcome",
    "with",
    "you",
    "your",
  ]),
  fr: new Set([
    "ai",
    "au",
    "aux",
    "avec",
    "bonjour",
    "ce",
    "ces",
    "cette",
    "dans",
    "de",
    "des",
    "du",
    "elle",
    "en",
    "est",
    "et",
    "français",
    "francaise",
    "française",
    "francais",
    "il",
    "je",
    "la",
    "langue",
    "le",
    "les",
    "mange",
    "merci",
    "mon",
    "nous",
    "pas",
    "pomme",
    "pour",
    "que",
    "qui",
    "suis",
    "sur",
    "ton",
    "tu",
    "un",
    "une",
    "vous",
  ]),
  de: new Set([
    "aber",
    "apfel",
    "auf",
    "aus",
    "das",
    "der",
    "deutsch",
    "die",
    "ein",
    "eine",
    "einen",
    "esse",
    "für",
    "hallo",
    "ich",
    "im",
    "ist",
    "mit",
    "nicht",
    "sie",
    "und",
    "von",
    "wir",
    "zu",
  ]),
  es: new Set([
    "al",
    "con",
    "de",
    "el",
    "en",
    "es",
    "español",
    "esta",
    "este",
    "gracias",
    "hola",
    "la",
    "las",
    "los",
    "manzana",
    "no",
    "para",
    "por",
    "que",
    "una",
    "uno",
    "y",
    "yo",
  ]),
  it: new Set([
    "ciao",
    "che",
    "con",
    "della",
    "di",
    "è",
    "e",
    "gli",
    "il",
    "in",
    "io",
    "italiano",
    "la",
    "le",
    "mangio",
    "mela",
    "non",
    "per",
    "sono",
    "un",
    "una",
  ]),
  pt: new Set([
    "a",
    "com",
    "de",
    "do",
    "e",
    "em",
    "esta",
    "eu",
    "não",
    "o",
    "obrigado",
    "olá",
    "para",
    "por",
    "português",
    "que",
    "uma",
    "você",
  ]),
  nl: new Set([
    "als",
    "de",
    "een",
    "en",
    "het",
    "hallo",
    "ik",
    "in",
    "is",
    "met",
    "niet",
    "nederlands",
    "op",
    "van",
    "voor",
    "wij",
    "zijn",
  ]),
};

const LATIN_LANGUAGE_CODES = Object.keys(LATIN_MARKERS);

type ScriptHint = {
  key: string;
  test: RegExp;
  fallback?: string;
  candidates?: string[];
};

const SCRIPT_HINTS: ScriptHint[] = [
  { key: "telugu", test: /\p{Script=Telugu}/u, fallback: "tel" },
  {
    key: "devanagari",
    test: /\p{Script=Devanagari}/u,
    fallback: "hin",
    candidates: ["hin", "mar", "nep"],
  },
  { key: "tamil", test: /\p{Script=Tamil}/u, fallback: "tam" },
  { key: "kannada", test: /\p{Script=Kannada}/u, fallback: "kan" },
  { key: "malayalam", test: /\p{Script=Malayalam}/u, fallback: "mal" },
  { key: "bengali", test: /\p{Script=Bengali}/u, fallback: "ben" },
  { key: "gujarati", test: /\p{Script=Gujarati}/u, fallback: "guj" },
  { key: "gurmukhi", test: /\p{Script=Gurmukhi}/u, fallback: "pan" },
  {
    key: "arabic",
    test: /\p{Script=Arabic}/u,
    fallback: "arb",
    candidates: ["arb", "ara", "urd"],
  },
  {
    key: "cyrillic",
    test: /\p{Script=Cyrillic}/u,
    fallback: "rus",
    candidates: ["rus", "ukr"],
  },
  { key: "greek", test: /\p{Script=Greek}/u, fallback: "ell" },
  { key: "hebrew", test: /\p{Script=Hebrew}/u, fallback: "heb" },
  { key: "hangul", test: /\p{Script=Hangul}/u, fallback: "kor" },
  { key: "hiragana", test: /\p{Script=Hiragana}/u, fallback: "jpn" },
  { key: "katakana", test: /\p{Script=Katakana}/u, fallback: "jpn" },
  { key: "han", test: /\p{Script=Han}/u, fallback: "cmn" },
  { key: "thai", test: /\p{Script=Thai}/u, fallback: "tha" },
  { key: "latin", test: /\p{Script=Latin}/u },
];

function countLetters(value: string) {
  return value.match(/\p{L}/gu)?.length ?? 0;
}

function countWords(value: string) {
  return value.match(/[\p{L}\p{M}\p{N}]+/gu)?.length ?? 0;
}

function scriptForCharacter(character: string) {
  if (/\p{Mark}/u.test(character)) return "mark";
  for (const hint of SCRIPT_HINTS) {
    if (hint.test.test(character)) return hint.key;
  }
  return "common";
}

function splitByScript(value: string) {
  const chunks: string[] = [];
  let activeScript = "";
  let buffer = "";

  const flush = () => {
    const cleaned = buffer.trim();
    if (countLetters(cleaned) >= 2) chunks.push(cleaned);
    buffer = "";
  };

  for (const character of value) {
    const script = scriptForCharacter(character);
    if (script === "common" || script === "mark") {
      buffer += character;
      continue;
    }

    if (activeScript && script !== activeScript) flush();
    activeScript = script;
    buffer += character;
  }

  flush();
  return chunks;
}

type LatinToken = {
  text: string;
  normalized: string;
  start: number;
  end: number;
};

function latinTokens(value: string): LatinToken[] {
  const pattern = /[\p{Script=Latin}\p{Mark}]+(?:['’][\p{Script=Latin}\p{Mark}]+)*/gu;
  return Array.from(value.matchAll(pattern)).map((match) => ({
    text: match[0],
    normalized: match[0].toLocaleLowerCase().normalize("NFC").replaceAll("’", "'"),
    start: match.index,
    end: match.index + match[0].length,
  }));
}

function markerMemberships(word: string) {
  return LATIN_LANGUAGE_CODES.filter((code) => LATIN_MARKERS[code].has(word));
}

function markerScores(value: string, candidates = LATIN_LANGUAGE_CODES) {
  const tokens = latinTokens(value);
  return candidates
    .map((code) => ({
      code,
      score: tokens.reduce(
        (sum, token) => sum + (LATIN_MARKERS[code].has(token.normalized) ? 1 : 0),
        0,
      ),
    }))
    .sort((left, right) => right.score - left.score);
}

function trainedLatinRanking(value: string, candidates = LATIN_LANGUAGE_CODES) {
  return detectAllTiny(value, { only: candidates }).filter(
    (item) => LANGUAGE_META_BY_ISO2[item.lang],
  );
}

function splitLatinCodeSwitches(value: string) {
  const tokens = latinTokens(value);
  if (tokens.length < 2) return [value];

  const memberships = tokens.map((token) => markerMemberships(token.normalized));
  const anchoredLanguages = Array.from(
    new Set(memberships.filter((codes) => codes.length === 1).map((codes) => codes[0])),
  );
  if (anchoredLanguages.length < 2) return [value];

  const emissions = tokens.map((token, index) => {
    const windowText = tokens
      .slice(Math.max(0, index - 1), Math.min(tokens.length, index + 2))
      .map((item) => item.text)
      .join(" ");
    const trained = trainedLatinRanking(windowText, anchoredLanguages);

    return anchoredLanguages.map((code) => {
      const membership = memberships[index];
      let score = LATIN_MARKERS[code].has(token.normalized)
        ? membership.length === 1
          ? 6
          : 3
        : 0;
      const trainedMatch = trained.find((item) => item.lang === code);
      score += (trainedMatch?.accuracy ?? 0) * 2;

      for (let neighbor = 0; neighbor < memberships.length; neighbor += 1) {
        if (memberships[neighbor].length === 1 && memberships[neighbor][0] === code) {
          score += Math.max(0, 1.2 - Math.abs(neighbor - index) * 0.35);
        }
      }
      return score;
    });
  });

  const switchPenalty = 2.4;
  const scores = emissions.map(() => anchoredLanguages.map(() => Number.NEGATIVE_INFINITY));
  const previous = emissions.map(() => anchoredLanguages.map(() => -1));
  scores[0] = [...emissions[0]];

  for (let tokenIndex = 1; tokenIndex < tokens.length; tokenIndex += 1) {
    for (let languageIndex = 0; languageIndex < anchoredLanguages.length; languageIndex += 1) {
      for (let previousIndex = 0; previousIndex < anchoredLanguages.length; previousIndex += 1) {
        const candidate =
          scores[tokenIndex - 1][previousIndex] +
          emissions[tokenIndex][languageIndex] -
          (previousIndex === languageIndex ? 0 : switchPenalty);
        if (candidate > scores[tokenIndex][languageIndex]) {
          scores[tokenIndex][languageIndex] = candidate;
          previous[tokenIndex][languageIndex] = previousIndex;
        }
      }
    }
  }

  const labels = new Array<number>(tokens.length);
  labels[tokens.length - 1] = scores[tokens.length - 1].reduce(
    (best, score, index, row) => (score > row[best] ? index : best),
    0,
  );
  for (let index = tokens.length - 1; index > 0; index -= 1) {
    labels[index - 1] = previous[index][labels[index]];
  }

  const segments: string[] = [];
  let groupStart = 0;
  for (let index = 1; index <= tokens.length; index += 1) {
    if (index === tokens.length || labels[index] !== labels[index - 1]) {
      const start = groupStart === 0 ? 0 : tokens[groupStart].start;
      const end = index === tokens.length ? value.length : tokens[index].start;
      const segment = value.slice(start, end).trim();
      if (countLetters(segment) >= 2) segments.push(segment);
      groupStart = index;
    }
  }

  return segments.length > 1 ? segments : [value];
}

function segmentContent(text: string) {
  const normalized = text.replace(/\r\n?/g, "\n").replace(/[\t ]+/g, " ").trim();
  const sentences = normalized
    .split(/(?<=[.!?。！？।])\s+|\n+/u)
    .map((part) => part.trim())
    .filter((part) => countLetters(part) >= 2);

  const pieces = sentences
    .flatMap((sentence) => splitByScript(sentence))
    .flatMap((piece) =>
      hintFor(piece)?.key === "latin" ? splitLatinCodeSwitches(piece) : [piece],
    );
  return pieces.length ? pieces : splitByScript(normalized);
}

function hintFor(value: string) {
  return SCRIPT_HINTS.find((hint) => hint.test.test(value));
}

function selectFrancCode(value: string, hint?: ScriptHint) {
  const ranked = francAll(value, { minLength: 3 });
  if (!ranked.length || ranked[0][0] === "und") {
    return { code: hint?.fallback ?? "eng", score: 0.72 };
  }

  const allowed = hint?.candidates;
  const match = allowed?.length
    ? ranked.find(([code]) => allowed.includes(code))
    : ranked.find(([code]) => LANGUAGE_META[code]);
  const selected = match ?? ranked[0];
  const selectedCode = LANGUAGE_META[selected[0]] ? selected[0] : hint?.fallback ?? "eng";
  const score = selectedCode === selected[0] ? selected[1] : 0.72;
  return { code: selectedCode, score };
}

function identifySegment(value: string) {
  const hint = hintFor(value);
  const directScript = hint?.fallback && !hint.candidates;

  if (hint?.key === "latin") {
    const tokenCount = latinTokens(value).length;
    const scores = markerScores(value);
    const top = scores[0];
    const second = scores[1];
    if (
      top.score > second.score &&
      (top.score >= 2 || (tokenCount <= 3 && top.score === 1))
    ) {
      return {
        ...LANGUAGE_META_BY_ISO2[top.code],
        confidence: top.score >= 2 ? 97 : 94,
      };
    }

    const trained = trainedLatinRanking(value);
    if (trained.length) {
      const first = trained[0];
      const next = trained[1];
      const margin = first.accuracy - (next?.accuracy ?? 0);
      const confidence = Math.round(
        Math.min(98, Math.max(62, 70 + first.accuracy * 18 + margin * 35)),
      );
      return { ...LANGUAGE_META_BY_ISO2[first.lang], confidence };
    }
  }

  let detected: { code: string; score: number };
  if (directScript) {
    detected = { code: hint.fallback!, score: 0.97 };
  } else {
    detected = selectFrancCode(value, hint);
  }

  const meta = LANGUAGE_META[detected.code] ?? LANGUAGE_META.eng;
  const confidence = Math.round(Math.min(0.99, Math.max(0.58, detected.score)) * 100);
  return { ...meta, confidence };
}

export function detectLanguages(text: string, sourceName = "Pasted text"): DetectionResponse {
  const normalized = text.replace(/\u0000/g, "").trim();
  if (countLetters(normalized) < 3) {
    throw new Error("The content does not contain enough readable text to identify a language.");
  }

  const detectedSegments = segmentContent(normalized).map((segment) => {
    const language = identifySegment(segment);
    return {
      text: segment,
      language: language.name,
      code: language.code,
      confidence: language.confidence,
      characters: countLetters(segment),
      words: countWords(segment),
    };
  });

  const aggregate = new Map<
    string,
    {
      name: string;
      code: string;
      characters: number;
      words: number;
      confidenceTotal: number;
    }
  >();

  for (const segment of detectedSegments) {
    const current = aggregate.get(segment.code) ?? {
      name: segment.language,
      code: segment.code,
      characters: 0,
      words: 0,
      confidenceTotal: 0,
    };
    current.characters += segment.characters;
    current.words += segment.words;
    current.confidenceTotal += segment.confidence * Math.max(1, segment.characters);
    aggregate.set(segment.code, current);
  }

  const totalMeasuredCharacters = Array.from(aggregate.values()).reduce(
    (sum, item) => sum + item.characters,
    0,
  );
  const ranked = Array.from(aggregate.values()).sort(
    (left, right) => right.characters - left.characters,
  );

  const percentages = ranked.map((item) =>
    Math.round((item.characters / Math.max(1, totalMeasuredCharacters)) * 100),
  );
  if (percentages.length) {
    percentages[0] += 100 - percentages.reduce((sum, value) => sum + value, 0);
  }

  const languages = ranked.map((item, index) => ({
    name: item.name,
    code: item.code,
    percentage: percentages[index],
    confidence: Math.round(item.confidenceTotal / Math.max(1, item.characters)),
    character_count: item.characters,
    word_count: item.words,
  }));

  return {
    source_name: sourceName,
    total_languages: languages.length,
    character_count: normalized.length,
    word_count: countWords(normalized),
    languages,
    segments: detectedSegments.slice(0, 60).map((segment) => ({
      text: segment.text,
      language: segment.language,
      code: segment.code,
      confidence: segment.confidence,
    })),
    analyzed_at: new Date().toISOString(),
  };
}
