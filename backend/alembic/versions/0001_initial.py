"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-15
"""
from alembic import op
import sqlalchemy as sa

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'shops',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('owner_name', sa.String(length=50), nullable=True),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('daily_limit', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=200), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['shop_id'], ['shops.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )

    op.create_table(
        'orders',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=False),
        sa.Column('customer_name', sa.String(length=50), nullable=True),
        sa.Column('customer_phone', sa.String(length=20), nullable=True),
        sa.Column('pickup_date', sa.Date(), nullable=False),
        sa.Column('pickup_time', sa.String(length=10), nullable=True),
        sa.Column('cake_size', sa.String(length=20), nullable=True),
        sa.Column('cake_flavor', sa.String(length=50), nullable=True),
        sa.Column('lettering', sa.String(length=200), nullable=True),
        sa.Column('design_note', sa.Text(), nullable=True),
        sa.Column('design_image', sa.String(length=500), nullable=True),
        sa.Column('price', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('deposit', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('deposit_paid', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('status', sa.Enum('inquiry', 'confirmed', 'making', 'done', 'cancelled', name='orderstatus'), nullable=True),
        sa.Column('raw_chat', sa.Text(), nullable=True),
        sa.Column('memo', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['shop_id'], ['shops.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'form_configs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=False),
        sa.Column('size_options', sa.JSON(), nullable=True),
        sa.Column('flavor_options', sa.JSON(), nullable=True),
        sa.Column('cancellation_policy', sa.Text(), nullable=True),
        sa.Column('slug', sa.String(length=100), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['shop_id'], ['shops.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('shop_id'),
        sa.UniqueConstraint('slug'),
    )


def downgrade() -> None:
    op.drop_table('form_configs')
    op.drop_table('orders')
    op.drop_table('users')
    op.drop_table('shops')
