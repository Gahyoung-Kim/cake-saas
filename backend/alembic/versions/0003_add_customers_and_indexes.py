"""add customers and order indexes

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-22
"""
from alembic import op
import sqlalchemy as sa

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'customers',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('shop_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('memo', sa.Text(), nullable=True),
        sa.Column('last_order_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['shop_id'], ['shops.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('shop_id', 'phone', name='uq_customers_shop_phone'),
    )
    op.create_index('ix_customers_shop_name', 'customers', ['shop_id', 'name'])

    op.add_column('orders', sa.Column('customer_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_orders_customer_id_customers', 'orders', 'customers', ['customer_id'], ['id'])

    op.execute("""
        INSERT INTO customers (shop_id, name, phone, last_order_at, created_at, updated_at)
        SELECT
            o.shop_id,
            COALESCE(NULLIF(TRIM(o.customer_name), ''), NULLIF(REPLACE(REPLACE(REPLACE(TRIM(o.customer_phone), '-', ''), ' ', ''), '.', ''), ''), 'Customer') AS name,
            MIN(NULLIF(TRIM(o.customer_phone), '')) AS phone,
            MAX(o.created_at) AS last_order_at,
            NOW() AS created_at,
            NOW() AS updated_at
        FROM orders o
        WHERE o.customer_name IS NOT NULL OR o.customer_phone IS NOT NULL
        GROUP BY
            o.shop_id,
            COALESCE(NULLIF(REPLACE(REPLACE(REPLACE(TRIM(o.customer_phone), '-', ''), ' ', ''), '.', ''), ''), CONCAT('__name__', TRIM(o.customer_name))),
            COALESCE(NULLIF(TRIM(o.customer_name), ''), NULLIF(REPLACE(REPLACE(REPLACE(TRIM(o.customer_phone), '-', ''), ' ', ''), '.', ''), ''), 'Customer'),
            NULLIF(REPLACE(REPLACE(REPLACE(TRIM(o.customer_phone), '-', ''), ' ', ''), '.', ''), '')
    """)

    op.execute("""
        UPDATE orders o
        JOIN customers c
          ON c.shop_id = o.shop_id
         AND (
              (
                   c.phone IS NOT NULL
                   AND NULLIF(REPLACE(REPLACE(REPLACE(TRIM(c.phone), '-', ''), ' ', ''), '.', ''), '')
                       = NULLIF(REPLACE(REPLACE(REPLACE(TRIM(o.customer_phone), '-', ''), ' ', ''), '.', ''), '')
              )
              OR (
                   c.phone IS NULL
                   AND NULLIF(REPLACE(REPLACE(REPLACE(TRIM(o.customer_phone), '-', ''), ' ', ''), '.', ''), '') IS NULL
                   AND c.name = TRIM(o.customer_name)
              )
         )
        SET o.customer_id = c.id
        WHERE o.customer_name IS NOT NULL OR o.customer_phone IS NOT NULL
    """)

    op.create_index('ix_orders_shop_pickup_date', 'orders', ['shop_id', 'pickup_date'])
    op.create_index('ix_orders_shop_status', 'orders', ['shop_id', 'status'])
    op.create_index('ix_orders_shop_customer_id', 'orders', ['shop_id', 'customer_id'])
    op.create_index('ix_orders_shop_customer_name', 'orders', ['shop_id', 'customer_name'])
    op.create_index('ix_orders_shop_customer_phone', 'orders', ['shop_id', 'customer_phone'])


def downgrade() -> None:
    op.drop_constraint('fk_orders_customer_id_customers', 'orders', type_='foreignkey')
    op.create_index('ix_orders_shop_id_downgrade', 'orders', ['shop_id'])
    op.drop_index('ix_orders_shop_customer_phone', table_name='orders')
    op.drop_index('ix_orders_shop_customer_name', table_name='orders')
    op.drop_index('ix_orders_shop_customer_id', table_name='orders')
    op.drop_index('ix_orders_shop_status', table_name='orders')
    op.drop_index('ix_orders_shop_pickup_date', table_name='orders')
    op.drop_column('orders', 'customer_id')
    op.drop_index('ix_customers_shop_name', table_name='customers')
    op.drop_table('customers')
