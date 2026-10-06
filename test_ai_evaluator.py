import json
import unittest

import httpx

from ai_evaluator import (
    EvaluationConfigurationError,
    EvaluationError,
    OpenAICompatibleEvaluator,
)


def provider_response(content: str, status_code: int = 200) -> httpx.Response:
    return httpx.Response(
        status_code,
        json={"choices": [{"message": {"content": content}}]},
    )


class AIEvaluatorTests(unittest.TestCase):
    def evaluator(self, handler) -> OpenAICompatibleEvaluator:
        client = httpx.Client(transport=httpx.MockTransport(handler))
        self.addCleanup(client.close)
        return OpenAICompatibleEvaluator("test-key", "test-model", client=client)

    def test_valid_response_is_parsed_and_uses_structured_output(self) -> None:
        content = json.dumps(
            {
                "relevance": 0.9,
                "completeness": 0.7,
                "specificity": 0.8,
                "evidence": 0.6,
                "correctness": 0.85,
                "contradiction_detected": False,
                "unsupported_claim_detected": True,
            }
        )

        def handler(request: httpx.Request) -> httpx.Response:
            body = json.loads(request.content)
            assert request.url.path == "/v1/chat/completions"
            assert body["response_format"] == {"type": "json_object"}
            assert "untrusted quoted data" in body["messages"][0]["content"]
            return provider_response(content)

        result = self.evaluator(handler).evaluate("Explain SQL indexes", "They speed lookups.")

        self.assertEqual(result.relevance, 0.9)
        self.assertTrue(result.unsupported_claim_detected)

    def test_malformed_or_out_of_range_model_output_is_rejected(self) -> None:
        evaluator = self.evaluator(lambda _: provider_response('{"relevance": 2}'))

        with self.assertRaises(EvaluationError):
            evaluator.evaluate("Question", "Answer")

    def test_provider_failure_does_not_leak_response_body(self) -> None:
        evaluator = self.evaluator(lambda _: provider_response("private details", 503))

        with self.assertRaisesRegex(EvaluationError, "AI provider request failed"):
            evaluator.evaluate("Question", "Answer")

    def test_missing_credentials_fail_closed(self) -> None:
        with self.assertRaises(EvaluationConfigurationError):
            OpenAICompatibleEvaluator.from_environment()

    def test_empty_and_oversized_answers_are_rejected(self) -> None:
        evaluator = self.evaluator(lambda _: provider_response("{}"))

        with self.assertRaises(ValueError):
            evaluator.evaluate("Question", "  ")
        with self.assertRaises(ValueError):
            evaluator.evaluate("Question", "a" * 12_001)


if __name__ == "__main__":
    unittest.main()