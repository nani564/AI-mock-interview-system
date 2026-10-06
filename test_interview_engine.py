import unittest

from interview_engine import (
    AnswerAssessment,
    Difficulty,
    InterviewerPersonality,
    InterviewState,
    NextAction,
    SkillPerformance,
    decide_next_step,
)


def assessment(value: float, **overrides: object) -> AnswerAssessment:
    scores: dict[str, object] = {
        "relevance": value,
        "completeness": value,
        "specificity": value,
        "evidence": value,
    }
    scores.update(overrides)
    return AnswerAssessment(**scores)  # type: ignore[arg-type]


class AdaptiveDecisionTests(unittest.TestCase):
    def test_weak_answer_gets_targeted_followup_and_reduces_only_its_skill(self) -> None:
        state = InterviewState(
            skill_performance={"SQL": SkillPerformance(difficulty=Difficulty.HARD)}
        )
        state.current_question_id = "q-1"

        decision = decide_next_step(
            state,
            "SQL",
            assessment(0.3, relevance=0.8, specificity=0.2),
        )

        self.assertEqual(decision.action, NextAction.FOLLOW_UP)
        self.assertEqual(decision.focus, "specific_example")
        self.assertEqual(decision.difficulty, Difficulty.MEDIUM)
        self.assertNotIn("Python", state.skill_performance)
        self.assertIn("SQL", state.weak_areas)
        self.assertEqual(state.answer_history[0].question_id, "q-1")

    def test_strong_answer_advances_and_increases_only_that_skill(self) -> None:
        state = InterviewState(
            skill_performance={"DSA": SkillPerformance(difficulty=Difficulty.MEDIUM)}
        )

        decision = decide_next_step(state, "DSA", assessment(0.95))

        self.assertEqual(decision.action, NextAction.ADVANCE)
        self.assertEqual(decision.difficulty, Difficulty.HARD)
        self.assertIn("DSA", state.strong_areas)

    def test_contradiction_takes_precedence_over_low_quality_followup(self) -> None:
        decision = decide_next_step(
            InterviewState(),
            "Python",
            assessment(0.2, contradiction_detected=True),
        )

        self.assertEqual(decision.action, NextAction.CHALLENGE)
        self.assertEqual(decision.focus, "resolve_contradiction")

    def test_personality_changes_interviewer_guidance(self) -> None:
        answer = assessment(0.3)
        friendly = decide_next_step(
            InterviewState(personality=InterviewerPersonality.FRIENDLY), "SQL", answer
        )
        strict = decide_next_step(
            InterviewState(personality=InterviewerPersonality.STRICT), "SQL", answer
        )

        self.assertNotEqual(friendly.interviewer_guidance, strict.interviewer_guidance)

    def test_followup_limit_forces_advance(self) -> None:
        state = InterviewState(followups_for_current_question=2)

        decision = decide_next_step(state, "communication", assessment(0.2))

        self.assertEqual(decision.action, NextAction.ADVANCE)
        self.assertEqual(decision.reason, "followup_limit_reached")

    def test_scores_outside_normalized_range_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            assessment(1.1)


if __name__ == "__main__":
    unittest.main()