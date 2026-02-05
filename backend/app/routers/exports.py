import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Lead, Customer, OrderInfo, Ticket
from ..rbac import require_perm

router = APIRouter(prefix="/exports", tags=["exports"])


def _csv_response(filename: str, headers: list[str], rows: list[list[str | int | float]]):
    sio = io.StringIO()
    writer = csv.writer(sio)
    writer.writerow(headers)
    writer.writerows(rows)
    sio.seek(0)
    return StreamingResponse(iter([sio.getvalue()]), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.get("/leads")
def export_leads(db: Session = Depends(get_db), _=Depends(require_perm("lead.view"))):
    data = db.query(Lead).order_by(Lead.created_at.desc()).all()
    rows = [[str(x.id), x.name, x.mobile, x.source, x.stage.value] for x in data]
    return _csv_response("leads.csv", ["id", "name", "mobile", "source", "stage"], rows)


@router.get("/customers")
def export_customers(db: Session = Depends(get_db), _=Depends(require_perm("customer.view"))):
    data = db.query(Customer).order_by(Customer.created_at.desc()).all()
    rows = [[str(x.id), x.name, x.mobile, x.wechat or "", x.address or ""] for x in data]
    return _csv_response("customers.csv", ["id", "name", "mobile", "wechat", "address"], rows)


@router.get("/orders")
def export_orders(db: Session = Depends(get_db), _=Depends(require_perm("order.view"))):
    data = db.query(OrderInfo).order_by(OrderInfo.created_at.desc()).all()
    rows = [[str(x.id), x.order_no, float(x.total_amount), float(x.paid_amount), x.status] for x in data]
    return _csv_response("orders.csv", ["id", "order_no", "total_amount", "paid_amount", "status"], rows)


@router.get("/tickets")
def export_tickets(db: Session = Depends(get_db), _=Depends(require_perm("ticket.view"))):
    data = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    rows = [[str(x.id), x.ticket_no, x.type, x.status] for x in data]
    return _csv_response("tickets.csv", ["id", "ticket_no", "type", "status"], rows)
