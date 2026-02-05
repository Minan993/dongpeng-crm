from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..errors import ok
from ..models import Quote, User
from ..rbac import require_perm
from ..schemas import QuoteCreate

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("")
def list_quotes(db: Session = Depends(get_db), _=Depends(require_perm("quote.view"))):
    rows = db.query(Quote).order_by(Quote.created_at.desc()).all()
    return ok([{"id": str(r.id), "customer_id": str(r.customer_id), "version_no": r.version_no, "total_amount": float(r.total_amount), "approve_status": r.approve_status} for r in rows])


@router.post("")
def create_quote(payload: QuoteCreate, db: Session = Depends(get_db), _current: User = Depends(require_perm("quote.create"))):
    row = Quote(customer_id=payload.customer_id, version_no=payload.version_no, total_amount=payload.total_amount)
    db.add(row)
    db.commit()
    return ok({"id": str(row.id)})
