from datetime import date, datetime
from typing import Literal
from .base import CamelModel

ExpenseCategoryLiteral = Literal['임대료', '전기세', '재료비', '포장재', '기타']
EXPENSE_CATEGORIES: list[str] = ['임대료', '전기세', '재료비', '포장재', '기타']


class ExpenseCreate(CamelModel):
    category:     ExpenseCategoryLiteral
    amount:       int
    memo:         str | None = None
    expense_date: date


class ExpenseUpdate(CamelModel):
    category:     ExpenseCategoryLiteral | None = None
    amount:       int | None = None
    memo:         str | None = None
    expense_date: date | None = None


class ExpenseResponse(CamelModel):
    id:           int
    category:     str
    amount:       int
    memo:         str | None
    expense_date: date
    created_at:   datetime
