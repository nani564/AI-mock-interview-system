from dataclasses import asdict
from typing import Iterator

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from ai_evaluator import (
	EvaluationConfigurationError,
	EvaluationError,
	OpenAICompatibleEvaluator,
)
from interview_engine import (
	AnswerAssessment,
	Difficulty,
	InterviewerPersonality,
	InterviewState,
	SkillPerformance,
	decide_next_step,
)

app = FastAPI(
	title="AI Mock Interview System API",
	description="Backend for adaptive interview training and feedback.",
	version="0.1.0",
)
app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
	allow_credentials=False,
	allow_methods=["GET", "POST"],
	allow_headers=["content-type"],
)


class AnswerEvaluationRequest(BaseModel):
	question: str = Field(min_length=1, max_length=4_000)
	answer: str = Field(min_length=1, max_length=12_000)
	skill: str = Field(min_length=1, max_length=80)
	resume_evidence: str = Field(default="", max_length=12_000)
	personality: InterviewerPersonality = InterviewerPersonality.FRIENDLY
	difficulty: Difficulty = Difficulty.MEDIUM
	current_question_id: str | None = Field(default=None, max_length=120)
	followups_for_current_question: int = Field(default=0, ge=0, le=5)
	max_followups_per_question: int = Field(default=2, ge=0, le=5)

	@field_validator("question", "answer", "skill")
	@classmethod
	def reject_blank_text(cls, value: str) -> str:
		value = value.strip()
		if not value:
			raise ValueError("must not be blank")
		return value


class AssessmentResult(BaseModel):
	relevance: float
	completeness: float
	specificity: float
	evidence: float
	correctness: float | None
	contradiction_detected: bool
	unsupported_claim_detected: bool
	quality: float


class AdaptiveDecisionResult(BaseModel):
	action: str
	skill: str
	difficulty: Difficulty
	focus: str | None
	reason: str
	interviewer_guidance: str
	followups_for_current_question: int
	skill_score: float


class AnswerEvaluationResponse(BaseModel):
	assessment: AssessmentResult
	decision: AdaptiveDecisionResult


def get_evaluator() -> Iterator[OpenAICompatibleEvaluator]:
	try:
		evaluator = OpenAICompatibleEvaluator.from_environment()
	except EvaluationConfigurationError as exc:
		raise HTTPException(
			status_code=503,
			detail="AI evaluation is not configured on the server",
		) from exc
	try:
		yield evaluator
	finally:
		evaluator.close()


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
	return {"status": "ok"}


@app.post(
	"/answers/evaluate",
	response_model=AnswerEvaluationResponse,
	tags=["interviews"],
)
def evaluate_answer(
	request: AnswerEvaluationRequest,
	evaluator: OpenAICompatibleEvaluator = Depends(get_evaluator),
) -> AnswerEvaluationResponse:
	try:
		assessment: AnswerAssessment = evaluator.evaluate(
			question=request.question,
			answer=request.answer,
			resume_evidence=request.resume_evidence,
		)
	except ValueError as exc:
		raise HTTPException(status_code=422, detail=str(exc)) from exc
	except EvaluationError as exc:
		raise HTTPException(
			status_code=502,
			detail="AI provider failed to return a valid assessment",
		) from exc

	state = InterviewState(
		personality=request.personality,
		followups_for_current_question=request.followups_for_current_question,
		max_followups_per_question=request.max_followups_per_question,
	)
	state.current_question_id = request.current_question_id
	state.skill_performance[request.skill] = SkillPerformance(difficulty=request.difficulty)
	decision = decide_next_step(state, request.skill, assessment)
	performance = state.skill_performance[request.skill]

	return AnswerEvaluationResponse(
		assessment=AssessmentResult(**asdict(assessment), quality=assessment.quality),
		decision=AdaptiveDecisionResult(
			action=decision.action.value,
			skill=decision.skill,
			difficulty=decision.difficulty,
			focus=decision.focus,
			reason=decision.reason,
			interviewer_guidance=decision.interviewer_guidance,
			followups_for_current_question=state.followups_for_current_question,
			skill_score=performance.score or 0.0,
		),
	)
