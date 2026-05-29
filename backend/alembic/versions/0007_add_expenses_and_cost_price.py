"""add expenses table and cost_price to orders

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-29
"""
from alembic import op
import sqlalchemy as sa

revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'expenses',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('shop_id', sa.Integer(), nullable=False),
        sa.Column('category', sa.Enum('임대료', '전기세', '재료비', '포장재', '기타', name='expensecategory'), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('memo', sa.Text(), nullable=True),
        sa.Column('expense_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['shop_id'], ['shops.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_expenses_shop_id',    'expenses', ['shop_id'])
    op.create_index('ix_expenses_date',       'expenses', ['expense_date'])
    op.add_column('orders', sa.Column('cost_price', sa.Integer(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('orders', 'cost_price')
    op.drop_index('ix_expenses_date',    table_name='expenses')
    op.drop_index('ix_expenses_shop_id', table_name='expenses')
    op.drop_table('expenses')
