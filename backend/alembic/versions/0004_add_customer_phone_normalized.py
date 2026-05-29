"""add customer phone normalized

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-22
"""
from alembic import op
import sqlalchemy as sa

revision = '0004'
down_revision = '0003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('customers', sa.Column('phone_normalized', sa.String(length=20), nullable=True))
    op.execute("""
        UPDATE customers
        SET phone_normalized = NULLIF(REPLACE(REPLACE(REPLACE(TRIM(phone), '-', ''), ' ', ''), '.', ''), '')
    """)
    op.drop_constraint('uq_customers_shop_phone', 'customers', type_='unique')
    op.create_unique_constraint(
        'uq_customers_shop_phone_normalized',
        'customers',
        ['shop_id', 'phone_normalized'],
    )


def downgrade() -> None:
    op.drop_constraint('uq_customers_shop_phone_normalized', 'customers', type_='unique')
    op.create_unique_constraint('uq_customers_shop_phone', 'customers', ['shop_id', 'phone'])
    op.drop_column('customers', 'phone_normalized')
