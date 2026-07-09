"""add quiz_answers to users

Revision ID: 9c2a3b4c5d6e
Revises: e3d1c9a2f1ab
Create Date: 2026-05-12

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9c2a3b4c5d6e"
down_revision: Union[str, Sequence[str], None] = "e3d1c9a2f1ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("quiz_answers", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "quiz_answers")
