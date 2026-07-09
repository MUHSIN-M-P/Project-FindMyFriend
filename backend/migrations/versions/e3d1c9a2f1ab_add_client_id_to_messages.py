"""add client_id to messages

Revision ID: e3d1c9a2f1ab
Revises: 75757c160ca1
Create Date: 2026-05-12

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e3d1c9a2f1ab"
down_revision: Union[str, Sequence[str], None] = "75757c160ca1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("client_id", sa.String(length=64), nullable=True))
    op.create_index("ix_messages_client_id", "messages", ["client_id"], unique=False)
    op.create_unique_constraint(
        "uq_messages_sender_client_id",
        "messages",
        ["sender_id", "client_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_messages_sender_client_id", "messages", type_="unique")
    op.drop_index("ix_messages_client_id", table_name="messages")
    op.drop_column("messages", "client_id")
