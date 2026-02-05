from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..errors import ok
from ..models import Ticket, User
from ..rbac import require_perm
from ..schemas import TicketCreate

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("")
def list_tickets(db: Session = Depends(get_db), _=Depends(require_perm("ticket.view"))):
    rows = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    return ok([{"id": str(r.id), "ticket_no": r.ticket_no, "type": r.type, "status": r.status} for r in rows])


@router.post("")
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db), _current: User = Depends(require_perm("ticket.create"))):
    if db.query(Ticket).filter(Ticket.ticket_no == payload.ticket_no).first():
        raise HTTPException(status_code=409, detail="工单号重复")
    row = Ticket(ticket_no=payload.ticket_no, customer_id=payload.customer_id, type=payload.type)
    db.add(row)
    db.commit()
    return ok({"id": str(row.id)})
