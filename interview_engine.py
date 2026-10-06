"""Deterministic interview adaptation from validated answer assessments."""

from dataclasses import dataclass, field
from enum import Enum
from statistics import fmean


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class InterviewMode(str, Enum):
    PRACTICE = "practice"
    PRESSURE = "pressure"


class InterviewerPersonality(str, Enum):
    FRIENDLY = "friendly"
    HR = "hr"
    STRICT = "strict"
    TECHNICAL = "technical"


class NextAction(str, Enum):
    ADVANCE = "advance"
    FOLLOW_UP = "follow_up"
    CHALLENGE = "challenge"
    REQUEST_EVIDENCE = "request_evidence"
    CLARIFY_RELEVANCE = "clarify_relevance"


@dataclass(frozen=True, slots=True)
class AnswerAssessment:
    """Normalized scores from a trusted evaluator; this module does not score text."""

    relevance: float
    completeness: float
    specificity: float
    evidence: float
    correctness: float | None = None
    contradiction_detected: bool = False
    unsupported_claim_detected: bool = False

    def __post_init__(self) -> None:
        for name in ("relevance", "completeness", "specificity", "evidence"):
            _validate_score(name, getattr(self, name))
        if self.correctness is not None:
            _validate_score("correctness", self.correctness)

    @property
    def quality(self) -> float:
        scores = [self.relevance, self.completeness, self.specificity, self.evidence]
        if self.correctness is not None:
            scores.append(self.correctness)
        return fmean(scores)


@dataclass(slots=True)
class SkillPerformance:
    score: float | None = None
    difficulty: Difficulty = Difficulty.MEDIUM
    attempts: int = 0


@dataclass(frozen=True, slots=True)
class AssessmentRecord:
    question_id: str | None
    skill: str
    quality: float
    action: NextAction


@dataclass(frozen=True, slots=True)
class FollowupDecision:
    action: NextAction
    skill: str
    difficulty: Difficulty
    focus: str | None
    reason: str
    interviewer_guidance: str


@dataclass(slots=True)
class InterviewState:
    personality: InterviewerPersonality = InterviewerPersonality.FRIENDLY
    mode: InterviewMode = InterviewMode.PRACTICE
    current_question_id: str | None = None
    question_history: list[str] = field(default_factory=list)
    answer_history: list[AssessmentRecord] = field(default_factory=list)
    skill_performance: dict[str, SkillPerformance] = field(default_factory=dict)
    weak_areas: set[str] = field(default_factory=set)
    strong_areas: set[str] = field(default_factory=set)
    followups_for_current_question: int = 0
    max_followups_per_question: int = 2
    remaining_seconds: int | None = None

    def __post_init__(self) -> None:
        if self.max_followups_per_question < 0:
            raise ValueError("max_followups_per_question cannot be negative")
        if self.remaining_seconds is not None and self.remaining_seconds < 0:
            raise ValueError("remaining_seconds cannot be negative")


_DIFFICULTIES = list(Difficulty)
_PERSONALITY_GUIDANCE = {
    InterviewerPersonality.FRIENDLY: "Keep the tone supportive and invite one clear example.",
    InterviewerPersonality.HR: "Use a behavioral framing; invite situation, action, and result when relevant.",
    InterviewerPersonality.STRICT: "Be direct and ask for a precise, verifiable explanation.",
    InterviewerPersonality.TECHNICAL: "Probe implementation details, trade-offs, and correctness.",
}
_FOCUS_BY_DIMENSION = {
    "completeness": "missing_detail",
    "specificity": "specific_example",
    "evidence": "supporting_evidence",
    "correctness": "verify_reasoning",
    "relevance": "answer_relevance",
}


def _validate_score(name: str, score: float) -> None:
    if not isinstance(score, (int, float)) or isinstance(score, bool) or not 0 <= score <= 1:
        raise ValueError(f"{name} must be a number between 0 and 1")


def _adapt_difficulty(current: Difficulty, quality: float) -> Difficulty:
    index = _DIFFICULTIES.index(current)
    if quality < 0.45:
        index = max(0, index - 1)
    elif quality >= 0.85:
        index = min(len(_DIFFICULTIES) - 1, index + 1)
    return _DIFFICULTIES[index]


def _weakest_dimension(assessment: AnswerAssessment) -> str:
    dimensions = {
        "relevance": assessment.relevance,
        "completeness": assessment.completeness,
        "specificity": assessment.specificity,
        "evidence": assessment.evidence,
    }
    if assessment.correctness is not None:
        dimensions["correctness"] = assessment.correctness
    return min(dimensions, key=dimensions.get)


def decide_next_step(
    state: InterviewState,
    skill: str,
    assessment: AnswerAssessment,
) -> FollowupDecision:
    """Update one skill's state and select a bounded, explainable next action."""
    skill = skill.strip()
    if not skill:
        raise ValueError("skill cannot be empty")

    performance = state.skill_performance.setdefault(skill, SkillPerformance())
    previous_score = performance.score
    performance.score = (
        assessment.quality
        if previous_score is None
        else previous_score * 0.7 + assessment.quality * 0.3
    )
    performance.attempts += 1
    performance.difficulty = _adapt_difficulty(performance.difficulty, assessment.quality)

    if assessment.quality < 0.55:
        state.weak_areas.add(skill)
        state.strong_areas.discard(skill)
    elif assessment.quality >= 0.82:
        state.strong_areas.add(skill)
        state.weak_areas.discard(skill)

    action = NextAction.ADVANCE
    focus = None
    reason = "answer_meets_threshold"
    if assessment.contradiction_detected:
        action, focus, reason = NextAction.CHALLENGE, "resolve_contradiction", "contradiction_detected"
    elif assessment.unsupported_claim_detected:
        action, focus, reason = NextAction.REQUEST_EVIDENCE, "support_claim", "unsupported_claim"
    elif assessment.relevance < 0.45:
        action, focus, reason = NextAction.CLARIFY_RELEVANCE, "answer_relevance", "low_relevance"
    elif assessment.quality < 0.78 or assessment.relevance < 0.65:
        weakest = _weakest_dimension(assessment)
        action, focus, reason = NextAction.FOLLOW_UP, _FOCUS_BY_DIMENSION[weakest], f"low_{weakest}"

    if action is not NextAction.ADVANCE:
        if state.followups_for_current_question >= state.max_followups_per_question:
            action, focus, reason = NextAction.ADVANCE, None, "followup_limit_reached"
        else:
            state.followups_for_current_question += 1

    decision = FollowupDecision(
        action=action,
        skill=skill,
        difficulty=performance.difficulty,
        focus=focus,
        reason=reason,
        interviewer_guidance=_PERSONALITY_GUIDANCE[state.personality],
    )
    state.answer_history.append(
        AssessmentRecord(state.current_question_id, skill, assessment.quality, action)
    )
    return decision


__all__ = [
    "AnswerAssessment",
    "AssessmentRecord",
    "Difficulty",
    "FollowupDecision",
    "InterviewMode",
    "InterviewerPersonality",
    "InterviewState",
    "NextAction",
    "SkillPerformance",
    "decide_next_step",
]