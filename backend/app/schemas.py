from datetime import datetime
from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str = Field(min_length=8)
    real_name: str
    mobile: str | None = None


class LeadCreate(BaseModel):
    name: str
    mobile: str
    source: str = "自然到店"


class LeadStageUpdate(BaseModel):
    stage: str


class CustomerCreate(BaseModel):
    name: str
    mobile: str
    wechat: str | None = None
    address: str | None = None
    tags: str | None = None


class CustomerMergeIn(BaseModel):
    keep_customer_id: str
    merge_customer_id: str


class MeasureCreate(BaseModel):
    customer_id: str
    appointment_time: datetime | None = None
    designer: str | None = None


class QuoteCreate(BaseModel):
    customer_id: str
    version_no: int = 1
    total_amount: float = 0


class OrderCreate(BaseModel):
    order_no: str
    customer_id: str
    total_amount: float = 0


class TicketCreate(BaseModel):
    ticket_no: str
    customer_id: str
    type: str = "补货"


class VisitCreate(BaseModel):
    customer_id: str
    satisfaction_score: int | None = None
    comment: str | None = None
