from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..errors import ok
from ..models import Measure, User
from ..rbac import require_perm
from ..schemas import MeasureCreate

router = APIRouter(prefix="/measures", tags=["measures"])


@router.get("")
def list_measures(db: Session = Depends(get_db), _=Depends(require_perm("measure.view"))):
    rows = db.query(Measure).order_by(Measure.created_at.desc()).all()
    return ok([{"id": str(r.id), "customer_id": str(r.customer_id), "status": r.status, "designer": r.designer} for r in rows])


@router.post("")
def create_measure(payload: MeasureCreate, db: Session = Depends(get_db), _current: User = Depends(require_perm("measure.create"))):
    row = Measure(customer_id=payload.customer_id, appointment_time=payload.appointment_time, designer=payload.designer)
    db.add(row)
    db.commit()
    return ok({"id": str(row.id)})
