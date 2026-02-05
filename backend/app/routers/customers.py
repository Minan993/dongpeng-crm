from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..errors import ok
from ..models import Customer, Followup, User, AuditLog
from ..rbac import require_perm
from ..schemas import CustomerCreate, CustomerMergeIn

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("")
def list_customers(db: Session = Depends(get_db), _=Depends(require_perm("customer.view"))):
    rows = db.query(Customer).order_by(Customer.created_at.desc()).all()
    return ok([{"id": str(r.id), "name": r.name, "mobile": r.mobile} for r in rows])


@router.post("")
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db), current: User = Depends(require_perm("customer.create"))):
    if db.query(Customer).filter(Customer.mobile == payload.mobile).first():
        raise HTTPException(status_code=409, detail="客户手机号重复")
    obj = Customer(**payload.model_dump())
    db.add(obj)
    db.add(AuditLog(biz_type="customer", biz_id="new", action="create", operator=current.username, detail=payload.mobile))
    db.commit()
    return ok({"id": str(obj.id)})


@router.post("/merge")
def merge_customer(payload: CustomerMergeIn, db: Session = Depends(get_db), current: User = Depends(require_perm("customer.merge"))):
    keep = db.get(Customer, payload.keep_customer_id)
    merge = db.get(Customer, payload.merge_customer_id)
    if not keep or not merge:
        raise HTTPException(status_code=404, detail="客户不存在")

    db.query(Followup).filter(Followup.customer_id == merge.id).update({"customer_id": keep.id})
    db.delete(merge)
    db.add(AuditLog(biz_type="customer", biz_id=str(keep.id), action="merge", operator=current.username, detail=str(payload.merge_customer_id)))
    db.commit()
    return ok({"keep_customer_id": str(keep.id)})
