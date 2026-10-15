"""add_area_capacities_to_event_session

Revision ID: a7f8c9d1e2b3
Revises: e4039a3350a7
Create Date: 2026-10-13 23:32:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7f8c9d1e2b3'
down_revision: Union[str, None] = 'e4039a3350a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('event_sessions', sa.Column('area_capacities', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('event_sessions', 'area_capacities')
