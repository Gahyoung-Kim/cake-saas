"""ensure order lookup indexes

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-22
"""
from alembic import op
import sqlalchemy as sa

revision = '0005'
down_revision = '0004'
branch_labels = None
depends_on = None


ORDER_INDEXES = {
    'ix_orders_shop_pickup_date': ['shop_id', 'pickup_date'],
    'ix_orders_shop_status': ['shop_id', 'status'],
    'ix_orders_shop_customer_id': ['shop_id', 'customer_id'],
    'ix_orders_shop_customer_name': ['shop_id', 'customer_name'],
    'ix_orders_shop_customer_phone': ['shop_id', 'customer_phone'],
}


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    existing_indexes = {index['name'] for index in inspector.get_indexes('orders')}

    for index_name, columns in ORDER_INDEXES.items():
        if index_name not in existing_indexes:
            op.create_index(index_name, 'orders', columns)


def downgrade() -> None:
    # These indexes are owned by revision 0003 on fresh databases. This
    # corrective migration only restores missing indexes in drifted databases.
    pass
