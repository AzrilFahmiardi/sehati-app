"""Adapter Gemini untuk menghasilkan explanation JSON tanpa mengirim PII."""

import json
import urllib.error
import urllib.request

from hemavision_api.core.config import ExplanationSettings
from hemavision_api.modules.explanation.service import ExplanationProviderError

SYSTEM_INSTRUCTION = (
    "Anda menjelaskan hasil skrining anemia berbasis AI. Gunakan hanya data yang diberikan. "
    "Jangan mendiagnosis, memberi dosis, menebak penyebab, atau mengarang nilai. "
    "Selalu jelaskan bahwa hasil bukan pengganti pemeriksaan laboratorium. "
    "Kembalikan JSON object dengan keys headline, summary, what_this_means, evidence, "
    "next_steps, warning_signs, questions_for_healthcare_worker, limitations. "
    "Semua nilai string atau array string."
)


class GeminiExplanationProvider:
    """Pemanggil minimal Gemini REST API dengan structured JSON response."""

    def __init__(self, settings: ExplanationSettings) -> None:
        self.api_key = settings.api_key
        self.model = settings.model
        self.timeout_seconds = settings.timeout_seconds
        self.max_output_tokens = settings.max_output_tokens

    def generate(
        self, *, source: dict[str, object], audience: str, locale: str
    ) -> dict[str, object]:
        if not self.api_key:
            raise ExplanationProviderError("provider_not_configured")
        prompt = json.dumps(
            {"audience": audience, "locale": locale, "screening": source},
            ensure_ascii=False,
        )
        payload = {
            "system_instruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": self.max_output_tokens,
                "responseMimeType": "application/json",
                "thinkingConfig": {"thinkingBudget": 0},
            },
        }
        request = urllib.request.Request(
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                body = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
            raise ExplanationProviderError("provider_unavailable") from error
        try:
            text = body["candidates"][0]["content"]["parts"][0]["text"]
            result = json.loads(text)
        except (KeyError, IndexError, TypeError, json.JSONDecodeError) as error:
            raise ExplanationProviderError("invalid_structured_output") from error
        if not isinstance(result, dict):
            raise ExplanationProviderError("invalid_structured_output")
        return result
