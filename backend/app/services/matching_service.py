import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import select

from app.models import db, User


def _normalize_tokens(raw: Optional[str]) -> List[str]:
    if not raw:
        return []
    parts = [p.strip().lower() for p in raw.split(",")]
    return [p for p in parts if p]


def _parse_quiz_answers(raw: Optional[str]) -> Dict[str, int]:
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except Exception:
        return {}

    if not isinstance(data, dict):
        return {}

    out: Dict[str, int] = {}
    for k, v in data.items():
        if v is None:
            continue
        try:
            out[str(k)] = int(v)
        except Exception:
            continue
    return out


def _quiz_similarity(a: Dict[str, int], b: Dict[str, int]) -> Tuple[float, int, int]:
    """Returns (similarity_0_to_1, matches, compared)."""
    if not a or not b:
        return 0.0, 0, 0

    shared_keys = set(a.keys()) & set(b.keys())
    if not shared_keys:
        return 0.0, 0, 0

    matches = sum(1 for k in shared_keys if a.get(k) == b.get(k))
    compared = len(shared_keys)
    return matches / compared, matches, compared


def _jaccard_similarity(a: List[str], b: List[str]) -> Tuple[float, int]:
    sa, sb = set(a), set(b)
    if not sa or not sb:
        return 0.0, 0
    inter = sa & sb
    union = sa | sb
    return len(inter) / len(union) if union else 0.0, len(inter)


@dataclass
class MatchExplanation:
    score: int
    quiz_similarity: int
    quiz_matches: int
    quiz_compared: int
    shared_hobbies: int


class MatchingService:
    """Deterministic, explainable matchmaking based on quiz answers + hobbies."""

    QUIZ_WEIGHT = 0.7
    HOBBY_WEIGHT = 0.3

    @staticmethod
    def compute_score_and_explanation(current: User, candidate: User) -> MatchExplanation:
        current_hobbies = _normalize_tokens(current.hobbies)
        candidate_hobbies = _normalize_tokens(candidate.hobbies)

        current_quiz = _parse_quiz_answers(current.quiz_answers)
        candidate_quiz = _parse_quiz_answers(candidate.quiz_answers)

        quiz_sim, quiz_matches, quiz_compared = _quiz_similarity(current_quiz, candidate_quiz)
        hobby_sim, shared_hobbies = _jaccard_similarity(current_hobbies, candidate_hobbies)

        # Convert to percentages
        quiz_pct = int(round(quiz_sim * 100))
        hobby_pct = int(round(hobby_sim * 100))

        score = int(round(quiz_pct * MatchingService.QUIZ_WEIGHT + hobby_pct * MatchingService.HOBBY_WEIGHT))

        return MatchExplanation(
            score=score,
            quiz_similarity=quiz_pct,
            quiz_matches=quiz_matches,
            quiz_compared=quiz_compared,
            shared_hobbies=shared_hobbies,
        )

    @staticmethod
    def get_matches_for_user(user_id: int, limit: int = 10, candidate_pool: int = 60) -> List[Dict[str, Any]]:
        current = db.session.get(User, user_id)
        if not current:
            return []

        # Pull a reasonable pool; rank in Python for explainability and simplicity.
        candidates = (
            db.session.execute(
                select(User)
                .where(User.id != user_id)
                .order_by(User.id.asc())
                .limit(candidate_pool)
            )
            .scalars()
            .all()
        )

        scored: List[Tuple[User, MatchExplanation]] = []
        for c in candidates:
            scored.append((c, MatchingService.compute_score_and_explanation(current, c)))

        scored.sort(key=lambda x: x[1].score, reverse=True)
        top = scored[: max(0, limit)]

        best_score = top[0][1].score if top else None
        highlight_best = best_score is not None and best_score > 0

        results: List[Dict[str, Any]] = []
        for candidate, expl in top:
            results.append(
                {
                    "id": candidate.id,
                    "name": candidate.username,
                    "pfp_path": candidate.profile_pic or "/avatars/male_avatar.png",
                    "age": candidate.age,
                    "sex": candidate.sex,
                    "hobbies": candidate.hobbies.split(",") if candidate.hobbies else [],
                    "bio": candidate.bio,
                    "score": expl.score,
                    "bestMatch": highlight_best and expl.score == best_score,
                    "explanation": {
                        "quiz_similarity": expl.quiz_similarity,
                        "quiz_matches": expl.quiz_matches,
                        "quiz_compared": expl.quiz_compared,
                        "shared_hobbies": expl.shared_hobbies,
                    },
                }
            )

        return results
