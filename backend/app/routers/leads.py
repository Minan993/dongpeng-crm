from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..errors import ok
from ..models import Lead, User, LeadStage, AuditLog
from ..rbac import require_perm
from ..schemas import LeadCreate, LeadStageUpdate

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("")
def list_leads(db: Session = Depends(get_db), _=Depends(require_perm("lead.view"))):
    rows = db.query(Lead).order_by(Lead.created_at.desc()).all()
    return ok([{
        "id": str(r.id), "name": r.name, "mobile": r.mobile, "source": r.source, "stage": r.stage.value
    } for r in rows])


@router.post("")
def create_lead(payload: LeadCreate, db: Session = Depends(get_db), current: User = Depends(require_perm("lead.create"))):
    row = Lead(name=payload.name, mobile=payload.mobile, source=payload.source)
    db.add(row)
    db.add(AuditLog(biz_type="lead", biz_id="new", action="create", operator=current.username, detail=payload.name))
    db.commit()
    return ok({"id": str(row.id)})


@router.put("/{lead_id}/stage")
def update_stage(lead_id: str, payload: LeadStageUpdate, db: Session = Depends(get_db), current: User = Depends(require_perm("lead.stage"))):
    row = db.get(Lead, lead_id)
    if not row:
        raise HTTPException(status_code=404, detail="线索不存在")
    try:
        row.stage = LeadStage(payload.stage)
    except Exception:
        raise HTTPException(status_code=400, detail="非法阶段")
    db.add(AuditLog(biz_type="lead", biz_id=str(row.id), action="stage", operator=current.username, detail=payload.stage))
    db.commit()
    return ok({"id": str(row.id), "stage": row.stage.value})
