import csv
import io
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..errors import ok
from ..models import Lead, User
from ..rbac import require_perm

router = APIRouter(prefix="/imports", tags=["imports"])


@router.post("/leads")
async def import_leads(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _current: User = Depends(require_perm("lead.create")),
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="仅支持 CSV")

    content = await file.read()
    text = content.decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(text))
    count = 0
    for row in reader:
        name = (row.get("name") or "").strip()
        mobile = (row.get("mobile") or "").strip()
        source = (row.get("source") or "自然到店").strip()
        if not name or not mobile:
            continue
        db.add(Lead(name=name, mobile=mobile, source=source))
        count += 1
    db.commit()
    return ok({"imported": count})
