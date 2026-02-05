from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..errors import ok
from ..models import Lead, Customer
from ..rbac import require_perm

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview")
def overview(db: Session = Depends(get_db), _=Depends(require_perm("dashboard.view"))):
    lead_count = db.query(Lead).count()
    customer_count = db.query(Customer).count()
    return ok({
        "lead_count": lead_count,
        "customer_count": customer_count,
        "conversion_rate": round((customer_count / lead_count) * 100, 2) if lead_count else 0,
    })
