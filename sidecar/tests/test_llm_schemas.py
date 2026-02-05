"""T6.1: ValidationResult Pydantic model accepts valid data and rejects invalid data."""

import pytest
from pydantic import ValidationError

from llm.schemas import (
    AmbiguiteitLevel,
    BloomLevel,
    DiscriminatieLevel,
    ImprovementSuggestion,
    ValidationResult,
)


def _valid_data() -> dict:
    return {
        "bet_discriminatie": "hoog",
        "bet_ambiguiteit": "geen",
        "bet_score": 4,
        "bet_toelichting": "Goede discriminatie, geen ambiguïteit.",
        "tech_kwal_stam_score": 5,
        "tech_kwal_afleiders_score": 4,
        "tech_kwal_score": 4,
        "tech_problemen": [],
        "tech_toelichting": "Technisch goed geconstrueerd.",
        "val_cognitief_niveau": "toepassen",
        "val_score": 3,
        "val_toelichting": "Toetst op toepassingsniveau.",
        "improvement_suggestions": [
            {"dimensie": "technisch", "suggestie": "Afleiders meer variëren."}
        ],
    }


class TestValidationResultValid:
    def test_accepts_valid_data(self):
        result = ValidationResult(**_valid_data())
        assert result.bet_score == 4
        assert result.bet_discriminatie == DiscriminatieLevel.hoog
        assert result.val_cognitief_niveau == BloomLevel.toepassen
        assert len(result.improvement_suggestions) == 1

    def test_all_score_boundaries(self):
        for score in [1, 2, 3, 4, 5]:
            data = _valid_data()
            data["bet_score"] = score
            data["tech_kwal_score"] = score
            data["val_score"] = score
            result = ValidationResult(**data)
            assert result.bet_score == score


class TestValidationResultInvalid:
    def test_bet_score_too_high(self):
        data = _valid_data()
        data["bet_score"] = 6
        with pytest.raises(ValidationError):
            ValidationResult(**data)

    def test_bet_score_too_low(self):
        data = _valid_data()
        data["bet_score"] = 0
        with pytest.raises(ValidationError):
            ValidationResult(**data)

    def test_invalid_discriminatie(self):
        data = _valid_data()
        data["bet_discriminatie"] = "ongeldig"
        with pytest.raises(ValidationError):
            ValidationResult(**data)

    def test_invalid_ambiguiteit(self):
        data = _valid_data()
        data["bet_ambiguiteit"] = "ongeldig"
        with pytest.raises(ValidationError):
            ValidationResult(**data)

    def test_invalid_bloom_level(self):
        data = _valid_data()
        data["val_cognitief_niveau"] = "ongeldig"
        with pytest.raises(ValidationError):
            ValidationResult(**data)

    def test_invalid_improvement_dimensie(self):
        data = _valid_data()
        data["improvement_suggestions"] = [
            {"dimensie": "ongeldig", "suggestie": "test"}
        ]
        with pytest.raises(ValidationError):
            ValidationResult(**data)
