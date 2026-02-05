from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..errors import ok
from ..models import Visit, User
from ..rbac import require_perm
from ..schemas import VisitCreate

router = APIRouter(prefix="/visits", tags=["visits"])


@router.get("")
def list_visits(db: Session = Depends(get_db), _=Depends(require_perm("visit.view"))):
    rows = db.query(Visit).order_by(Visit.created_at.desc()).all()
    return ok([{"id": str(r.id), "customer_id": str(r.customer_id), "satisfaction_score": r.satisfaction_score, "comment": r.comment} for r in rows])


@router.post("")
def create_visit(payload: VisitCreate, db: Session = Depends(get_db), _current: User = Depends(require_perm("visit.create"))):
    row = Visit(customer_id=payload.customer_id, satisfaction_score=payload.satisfaction_score, comment=payload.comment)
    db.add(row)
    db.commit()
    return ok({"id": str(row.id)})
