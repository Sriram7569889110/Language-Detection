"""Language analysis used by the Detection Lens FastAPI service."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
import re
import unicodedata

from langdetect import DetectorFactory, LangDetectException, detect_langs

DetectorFactory.seed = 0

LANGUAGES: dict[str, tuple[str, str]] = {
    "en": ("en", "English"),
    "te": ("te", "Telugu"),
    "hi": ("hi", "Hindi"),
    "mr": ("mr", "Marathi"),
    "ne": ("ne", "Nepali"),
    "ta": ("ta", "Tamil"),
    "kn": ("kn", "Kannada"),
    "ml": ("ml", "Malayalam"),
    "bn": ("bn", "Bengali"),
    "gu": ("gu", "Gujarati"),
    "pa": ("pa", "Punjabi"),
    "ur": ("ur", "Urdu"),
    "ar": ("ar", "Arabic"),
    "es": ("es", "Spanish"),
    "fr": ("fr", "French"),
    "de": ("de", "German"),
    "it": ("it", "Italian"),
    "pt": ("pt", "Portuguese"),
    "nl": ("nl", "Dutch"),
    "sv": ("sv", "Swedish"),
    "da": ("da", "Danish"),
    "no": ("no", "Norwegian"),
    "fi": ("fi", "Finnish"),
    "ru": ("ru", "Russian"),
    "uk": ("uk", "Ukrainian"),
    "pl": ("pl", "Polish"),
    "cs": ("cs", "Czech"),
    "ro": ("ro", "Romanian"),
    "hu": ("hu", "Hungarian"),
    "tr": ("tr", "Turkish"),
    "el": ("el", "Greek"),
    "he": ("he", "Hebrew"),
    "ja": ("ja", "Japanese"),
    "ko": ("ko", "Korean"),
    "zh-cn": ("zh", "Chinese"),
    "zh-tw": ("zh", "Chinese"),
    "vi": ("vi", "Vietnamese"),
    "id": ("id", "Indonesian"),
    "ms": ("ms", "Malay"),
    "th": ("th", "Thai"),
}

LATIN_MARKERS = {
    "en": {
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
    },
    "fr": {
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
    },
    "de": {
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
    },
    "es": {
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
    },
    "it": {
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
    },
    "pt": {
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
    },
    "nl": {
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
    },
}

LATIN_TOKEN_PATTERN = re.compile(
    r"[A-Za-zÀ-ÖØ-öø-ÿ]+(?:['’][A-Za-zÀ-ÖØ-öø-ÿ]+)*",
    flags=re.UNICODE,
)

# (name, first code point, last code point, fallback, possible language codes)
SCRIPT_RANGES = (
    ("telugu", 0x0C00, 0x0C7F, "te", None),
    ("devanagari", 0x0900, 0x097F, "hi", {"hi", "mr", "ne"}),
    ("tamil", 0x0B80, 0x0BFF, "ta", None),
    ("kannada", 0x0C80, 0x0CFF, "kn", None),
    ("malayalam", 0x0D00, 0x0D7F, "ml", None),
    ("bengali", 0x0980, 0x09FF, "bn", None),
    ("gurmukhi", 0x0A00, 0x0A7F, "pa", None),
    ("gujarati", 0x0A80, 0x0AFF, "gu", None),
    ("greek", 0x0370, 0x03FF, "el", None),
    ("cyrillic", 0x0400, 0x052F, "ru", {"ru", "uk"}),
    ("hebrew", 0x0590, 0x05FF, "he", None),
    ("arabic", 0x0600, 0x06FF, "ar", {"ar", "ur"}),
    ("thai", 0x0E00, 0x0E7F, "th", None),
    ("hiragana", 0x3040, 0x309F, "ja", None),
    ("katakana", 0x30A0, 0x30FF, "ja", None),
    ("hangul", 0xAC00, 0xD7AF, "ko", None),
    ("han", 0x4E00, 0x9FFF, "zh-cn", None),
    ("latin", 0x0041, 0x024F, None, None),
)


def _letters(value: str) -> int:
    return sum(character.isalpha() for character in value)


def _words(value: str) -> int:
    return len(re.findall(r"[^\W_]+", value, flags=re.UNICODE))


def _script_for_character(character: str) -> str:
    if unicodedata.category(character).startswith("M"):
        return "mark"
    point = ord(character)
    for name, start, end, _fallback, _candidates in SCRIPT_RANGES:
        if start <= point <= end:
            return name
    return "common"


def _script_hint(value: str):
    points = [ord(character) for character in value]
    for name, start, end, fallback, candidates in SCRIPT_RANGES:
        if any(start <= point <= end for point in points):
            return name, fallback, candidates
    return None, None, None


def _split_by_script(value: str) -> list[str]:
    pieces: list[str] = []
    active_script = ""
    buffer: list[str] = []

    def flush() -> None:
        cleaned = "".join(buffer).strip()
        if _letters(cleaned) >= 2:
            pieces.append(cleaned)
        buffer.clear()

    for character in value:
        script = _script_for_character(character)
        if script in {"common", "mark"}:
            buffer.append(character)
            continue
        if active_script and script != active_script:
            flush()
        active_script = script
        buffer.append(character)

    flush()
    return pieces


def _latin_tokens(value: str):
    return [
        {
            "text": match.group(0),
            "normalized": match.group(0).lower().replace("’", "'"),
            "start": match.start(),
            "end": match.end(),
        }
        for match in LATIN_TOKEN_PATTERN.finditer(value)
    ]


def _marker_memberships(word: str) -> list[str]:
    return [code for code, words in LATIN_MARKERS.items() if word in words]


def _split_latin_code_switches(value: str) -> list[str]:
    """Use word anchors plus NLP window scores to find same-script switches."""

    tokens = _latin_tokens(value)
    if len(tokens) < 2:
        return [value]

    memberships = [_marker_memberships(token["normalized"]) for token in tokens]
    anchored_languages = list(
        dict.fromkeys(codes[0] for codes in memberships if len(codes) == 1)
    )
    if len(anchored_languages) < 2:
        return [value]

    emissions: list[list[float]] = []
    for index, token in enumerate(tokens):
        window = " ".join(
            item["text"]
            for item in tokens[max(0, index - 1) : min(len(tokens), index + 2)]
        )
        trained = {item.lang: float(item.prob) for item in _probabilities(window)}
        token_scores = []

        for code in anchored_languages:
            membership = memberships[index]
            score = 0.0
            if token["normalized"] in LATIN_MARKERS[code]:
                score = 6.0 if len(membership) == 1 else 3.0
            score += trained.get(code, 0.0) * 2.0

            for neighbor, neighbor_memberships in enumerate(memberships):
                if len(neighbor_memberships) == 1 and neighbor_memberships[0] == code:
                    score += max(0.0, 1.2 - abs(neighbor - index) * 0.35)
            token_scores.append(score)
        emissions.append(token_scores)

    switch_penalty = 2.4
    scores = [[float("-inf")] * len(anchored_languages) for _ in tokens]
    previous = [[-1] * len(anchored_languages) for _ in tokens]
    scores[0] = emissions[0][:]

    for token_index in range(1, len(tokens)):
        for language_index in range(len(anchored_languages)):
            for previous_index in range(len(anchored_languages)):
                candidate = (
                    scores[token_index - 1][previous_index]
                    + emissions[token_index][language_index]
                    - (0 if previous_index == language_index else switch_penalty)
                )
                if candidate > scores[token_index][language_index]:
                    scores[token_index][language_index] = candidate
                    previous[token_index][language_index] = previous_index

    labels = [0] * len(tokens)
    labels[-1] = max(range(len(anchored_languages)), key=lambda item: scores[-1][item])
    for index in range(len(tokens) - 1, 0, -1):
        labels[index - 1] = previous[index][labels[index]]

    segments: list[str] = []
    group_start = 0
    for index in range(1, len(tokens) + 1):
        if index == len(tokens) or labels[index] != labels[index - 1]:
            start = 0 if group_start == 0 else tokens[group_start]["start"]
            end = len(value) if index == len(tokens) else tokens[index]["start"]
            segment = value[start:end].strip()
            if _letters(segment) >= 2:
                segments.append(segment)
            group_start = index

    return segments if len(segments) > 1 else [value]


def _segments(value: str) -> list[str]:
    normalized = re.sub(r"[\t ]+", " ", value.replace("\r\n", "\n").replace("\r", "\n")).strip()
    sentences = [
        item.strip()
        for item in re.split(r"(?<=[.!?。！？।])\s+|\n+", normalized)
        if _letters(item) >= 2
    ]
    pieces = []
    for sentence in sentences:
        for piece in _split_by_script(sentence):
            script, _fallback, _candidates = _script_hint(piece)
            pieces.extend(_split_latin_code_switches(piece) if script == "latin" else [piece])
    return pieces or _split_by_script(normalized)


def _probabilities(value: str):
    try:
        return detect_langs(value)
    except LangDetectException:
        return []


def _identify(value: str) -> tuple[str, str, int]:
    script, fallback, candidates = _script_hint(value)

    if script == "latin":
        words = [token["normalized"] for token in _latin_tokens(value)]
        scores = sorted(
            (
                (code, sum(word in markers for word in words))
                for code, markers in LATIN_MARKERS.items()
            ),
            key=lambda item: item[1],
            reverse=True,
        )
        if scores[0][1] > scores[1][1] and (
            scores[0][1] >= 2 or (len(words) <= 3 and scores[0][1] == 1)
        ):
            code, name = LANGUAGES[scores[0][0]]
            return code, name, 97 if scores[0][1] >= 2 else 94

    if fallback and candidates is None:
        code, name = LANGUAGES[fallback]
        return code, name, 97

    ranked = _probabilities(value)
    chosen = None
    if candidates:
        chosen = next((item for item in ranked if item.lang in candidates), None)
    if chosen is None:
        chosen = next((item for item in ranked if item.lang in LANGUAGES), None)

    detected_code = chosen.lang if chosen else (fallback or "en")
    if detected_code not in LANGUAGES:
        detected_code = fallback or "en"
    code, name = LANGUAGES[detected_code]
    probability = float(chosen.prob) if chosen and chosen.lang == detected_code else 0.72
    confidence = round(min(0.99, max(0.58, probability)) * 100)
    return code, name, confidence


def analyze_text(text: str, source_name: str = "Pasted text") -> dict:
    """Detect languages passage-by-passage and aggregate document proportions."""

    normalized = text.replace("\x00", "").strip()
    if _letters(normalized) < 3:
        raise ValueError("The content does not contain enough readable text to identify a language.")

    passages = []
    aggregate = defaultdict(
        lambda: {
            "name": "",
            "characters": 0,
            "words": 0,
            "confidence_total": 0,
        }
    )

    for passage in _segments(normalized):
        code, name, confidence = _identify(passage)
        characters = _letters(passage)
        words = _words(passage)
        passages.append(
            {
                "text": passage,
                "language": name,
                "code": code,
                "confidence": confidence,
            }
        )
        item = aggregate[code]
        item["name"] = name
        item["characters"] += characters
        item["words"] += words
        item["confidence_total"] += confidence * max(1, characters)

    ranked = sorted(aggregate.items(), key=lambda item: item[1]["characters"], reverse=True)
    measured_characters = sum(item["characters"] for _code, item in ranked) or 1
    percentages = [round(item["characters"] / measured_characters * 100) for _code, item in ranked]
    if percentages:
        percentages[0] += 100 - sum(percentages)

    languages = []
    for index, (code, item) in enumerate(ranked):
        languages.append(
            {
                "name": item["name"],
                "code": code,
                "percentage": percentages[index],
                "confidence": round(item["confidence_total"] / max(1, item["characters"])),
                "character_count": item["characters"],
                "word_count": item["words"],
            }
        )

    return {
        "source_name": source_name,
        "total_languages": len(languages),
        "character_count": len(normalized),
        "word_count": _words(normalized),
        "languages": languages,
        "segments": passages[:60],
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }
