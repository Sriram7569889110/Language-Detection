from detector import analyze_text


def test_mixed_language_text():
    result = analyze_text(
        "Welcome to our campus. మా కళాశాలకు స్వాగతం. हमारे परिसर में आपका स्वागत है।"
    )

    codes = {language["code"] for language in result["languages"]}
    assert result["total_languages"] == 3
    assert {"en", "te", "hi"}.issubset(codes)
    assert sum(language["percentage"] for language in result["languages"]) == 100


def test_french_english_without_punctuation():
    result = analyze_text("Je mange une pomme I eat an apple")

    codes = [language["code"] for language in result["languages"]]
    passage_codes = [segment["code"] for segment in result["segments"]]
    assert result["total_languages"] == 2
    assert set(codes) == {"fr", "en"}
    assert passage_codes == ["fr", "en"]
    assert "de" not in codes
    assert sum(language["percentage"] for language in result["languages"]) == 100


def test_single_word_french_english_switch():
    result = analyze_text("Bonjour hello")
    assert [segment["code"] for segment in result["segments"]] == ["fr", "en"]
