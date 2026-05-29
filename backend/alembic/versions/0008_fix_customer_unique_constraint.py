"""fix customer unique constraint to name+phone

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-29
"""
from alembic import op

revision = '0008'
down_revision = '0007'
branch_labels = None
depends_on = None


def upgrade():
    # 기존 phone_normalized 단독 유니크 제약 제거
    op.drop_constraint('uq_customers_shop_phone_normalized', 'customers', type_='unique')
    # name + phone_normalized 복합 유니크 제약 추가
    op.create_unique_constraint(
        'uq_customers_shop_name_phone',
        'customers',
        ['shop_id', 'name', 'phone_normalized'],
    )


def downgrade():
    op.drop_constraint('uq_customers_shop_name_phone', 'customers', type_='unique')
    op.create_unique_constraint(
        'uq_customers_shop_phone_normalized',
        'customers',
        ['shop_id', 'phone_normalized'],
    )
