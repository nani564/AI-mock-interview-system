from fastapi.testclient import TestClient

from interview_engine import AnswerAssessment

from app import app, get_evaluator


def test_health_endpoint_reports_ready() -> None:
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_endpoint_allows_local_frontend_origin() -> None:
    response = TestClient(app).get(
        "/health",
        headers={"Origin": "http://localhost:3000"},
    )

    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_answer_evaluation_allows_local_frontend_preflight() -> None:
    response = TestClient(app).options(
        "/answers/evaluate",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
    assert "POST" in response.headers["access-control-allow-methods"]


class FakeEvaluator:
    def evaluate(self, question: str, answer: str, resume_evidence: str = "") -> AnswerAssessment:
        return AnswerAssessment(
            relevance=0.9,
            completeness=0.8,
            specificity=0.7,
            evidence=0.8,
        )


def test_answer_evaluation_runs_assessment_through_adaptive_engine(monkeypatch) -> None:
    monkeypatch.setitem(app.dependency_overrides, get_evaluator, lambda: FakeEvaluator())
    response = TestClient(app).post(
        "/answers/evaluate",
        json={
            "question": "How did you use SQL indexes?",
            "answer": "I added an index after reviewing the query plan.",
            "skill": "SQL",
            "current_question_id": "q-1",
        },
    )

    assert response.status_code == 200
    assert response.json()["assessment"]["quality"] == 0.8
    assert response.json()["decision"]["action"] == "advance"
    assert response.json()["decision"]["difficulty"] == "medium"


def test_answer_evaluation_returns_safe_error_when_ai_is_not_configured(monkeypatch) -> None:
    monkeypatch.delenv("AI_API_KEY", raising=False)
    monkeypatch.delenv("AI_MODEL", raising=False)
    response = TestClient(app).post(
        "/answers/evaluate",
        json={"question": "Question", "answer": "Answer", "skill": "SQL"},
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "AI evaluation is not configured on the server"}


def test_answer_evaluation_rejects_blank_answers_before_provider_call(monkeypatch) -> None:
    monkeypatch.setitem(app.dependency_overrides, get_evaluator, lambda: FakeEvaluator())
    response = TestClient(app).post(
        "/answers/evaluate",
        json={"question": "Question", "answer": "  ", "skill": "SQL"},
    )

    assert response.status_code == 422