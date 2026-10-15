"""add_building_hierarchy_to_pos

Revision ID: cd05de9ff18d
Revises: e5a424868b5c
Create Date: 2026-10-04 05:37:43.790323

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cd05de9ff18d'
down_revision: Union[str, None] = 'e5a424868b5c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('master_pos', sa.Column('building', sa.String(length=128), nullable=False, server_default='Gedung Gereja Utama'))
    op.create_index(op.f('ix_master_pos_building'), 'master_pos', ['building'], unique=False)
    
    op.add_column('event_pos', sa.Column('building', sa.String(length=128), nullable=False, server_default='Gedung Gereja Utama'))
    op.create_index(op.f('ix_event_pos_building'), 'event_pos', ['building'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_event_pos_building'), table_name='event_pos')
    op.drop_column('event_pos', 'building')
    op.drop_index(op.f('ix_master_pos_building'), table_name='master_pos')
    op.drop_column('master_pos', 'building')
