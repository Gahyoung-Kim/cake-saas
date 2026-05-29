"""add expires_at to orders and inquiry_expire_minutes to shops

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-29
"""
from alembic import op
import sqlalchemy as sa

revision = '0006'
down_revision = '0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('orders', sa.Column('expires_at', sa.DateTime(), nullable=True))
    op.add_column('shops', sa.Column('inquiry_expire_minutes', sa.Integer(), nullable=False, server_default='60'))


def downgrade() -> None:
    op.drop_column('shops', 'inquiry_expire_minutes')
    op.drop_column('orders', 'expires_at')
