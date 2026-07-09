from typing import Any, Dict, List

from sqlalchemy import and_, func, select

from app.models import Conversations, Messages, User, db


class ActivityService:
    """Computes a lightweight activity feed for the UI.

    This implementation focuses on notifications used by the current UI:
    - req_accepted: someone replied in a conversation you initiated
    - new_friends: number of conversations where both users have messaged
    """

    @staticmethod
    def _conversation_sender_counts(conversation_id: int) -> int:
        return (
            db.session.execute(
                select(func.count(func.distinct(Messages.sender_id))).where(
                    Messages.conversation_id == conversation_id
                )
            ).scalar()
            or 0
        )

    @staticmethod
    def get_notifications(user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        # Conversations involving the user
        conversations = (
            db.session.execute(
                select(Conversations).where(
                    (Conversations.sender_id == user_id)
                    | (Conversations.receiver_id == user_id)
                )
            )
            .scalars()
            .all()
        )

        accepted_by: List[Dict[str, Any]] = []
        friend_count = 0

        for conv in conversations:
            # Determine if both participants have messaged
            distinct_senders = ActivityService._conversation_sender_counts(conv.id)
            if distinct_senders >= 2:
                friend_count += 1

            # Determine initiator: first message sender
            first_msg = db.session.execute(
                select(Messages)
                .where(Messages.conversation_id == conv.id)
                .order_by(Messages.created_at.asc())
                .limit(1)
            ).scalar_one_or_none()

            if not first_msg:
                continue

            initiator_id = first_msg.sender_id
            other_user_id = conv.receiver_id if user_id == conv.sender_id else conv.sender_id

            # If you initiated and they replied at least once, it's "accepted"
            if initiator_id == user_id:
                other_has_replied = (
                    db.session.execute(
                        select(func.count(Messages.id)).where(
                            and_(
                                Messages.conversation_id == conv.id,
                                Messages.sender_id == other_user_id,
                            )
                        )
                    ).scalar()
                    or 0
                )
                if other_has_replied > 0:
                    other = db.session.get(User, other_user_id)
                    if other:
                        accepted_by.append({"type": "req_accepted", "name": other.username})

        # Deduplicate by name/user
        seen = set()
        unique_accepts: List[Dict[str, Any]] = []
        for n in accepted_by:
            key = (n.get("type"), n.get("name"))
            if key in seen:
                continue
            seen.add(key)
            unique_accepts.append(n)

        notifications: List[Dict[str, Any]] = []

        if friend_count > 0:
            notifications.append({"type": "new_friends", "no": friend_count})

        notifications.extend(unique_accepts[:limit])

        return notifications
