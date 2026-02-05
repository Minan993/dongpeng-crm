from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..errors import ok
from ..models import OrderInfo, User
from ..rbac import require_perm
from ..schemas import OrderCreate

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("")
def list_orders(db: Session = Depends(get_db), _=Depends(require_perm("order.view"))):
    rows = db.query(OrderInfo).order_by(OrderInfo.created_at.desc()).all()
    return ok([{"id": str(r.id), "order_no": r.order_no, "status": r.status, "total_amount": float(r.total_amount), "paid_amount": float(r.paid_amount)} for r in rows])


@router.post("")
def create_order(payload: OrderCreate, db: Session = Depends(get_db), _current: User = Depends(require_perm("order.create"))):
    if db.query(OrderInfo).filter(OrderInfo.order_no == payload.order_no).first():
        raise HTTPException(status_code=409, detail="订单号重复")
    row = OrderInfo(order_no=payload.order_no, customer_id=payload.customer_id, total_amount=payload.total_amount)
    db.add(row)
    db.commit()
    return ok({"id": str(row.id)})


@router.get("/arrears")
def arrears(db: Session = Depends(get_db), _=Depends(require_perm("order.view"))):
    rows = db.query(OrderInfo).filter(OrderInfo.total_amount > OrderInfo.paid_amount).all()
    return ok([{"id": str(r.id), "order_no": r.order_no, "arrears": float(r.total_amount - r.paid_amount)} for r in rows])
