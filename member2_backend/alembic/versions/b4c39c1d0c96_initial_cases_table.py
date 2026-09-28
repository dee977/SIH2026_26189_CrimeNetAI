"""Initial cases table

Revision ID: b4c39c1d0c96
Revises: 
Create Date: 2026-09-25 17:18:08.610852

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4c39c1d0c96'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('cases',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('case_id', sa.String(), nullable=False),
    sa.Column('case_number', sa.String(), nullable=True),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('assigned_investigator', sa.String(), nullable=True),
    sa.Column('assigned_team', sa.String(), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.Column('priority', sa.String(), nullable=True),
    sa.Column('jurisdiction', sa.String(), nullable=True),
    sa.Column('police_station', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cases_case_id'), 'cases', ['case_id'], unique=True)
    op.create_index(op.f('ix_cases_id'), 'cases', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_cases_id'), table_name='cases')
    op.drop_index(op.f('ix_cases_case_id'), table_name='cases')
    op.drop_table('cases')

