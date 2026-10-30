import math
from typing import Generic, List, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    current_page: int
    page_size: int
    total_records: int
    total_pages: int
    items: List[T]

    @classmethod
    def create(cls, items: List[T], total_records: int, page: int, limit: int) -> "PaginatedResponse[T]":
        total_pages = math.ceil(total_records / limit) if total_records > 0 else 0
        return cls(
            current_page=page,
            page_size=limit,
            total_records=total_records,
            total_pages=total_pages,
            items=items
        )
