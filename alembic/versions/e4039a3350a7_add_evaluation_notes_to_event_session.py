"""add_evaluation_notes_to_event_session

Revision ID: e4039a3350a7
Revises: cd05de9ff18d
Create Date: 2026-10-04 10:56:38.977255

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4039a3350a7'
down_revision: Union[str, None] = 'cd05de9ff18d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('event_sessions', sa.Column('evaluation_notes', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('event_sessions', 'evaluation_notes')

