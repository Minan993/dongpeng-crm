from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..errors import ok
from ..models import User, AuditLog
from ..rbac import require_perm
from ..schemas import UserCreate
from ..security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
def list_users(db: Session = Depends(get_db), _=Depends(require_perm("user.view"))):
    rows = db.query(User).order_by(User.created_at.desc()).all()
    return ok([{
        "id": str(r.id), "username": r.username, "real_name": r.real_name, "mobile": r.mobile, "is_active": r.is_active
    } for r in rows])


@router.post("")
def create_user(payload: UserCreate, db: Session = Depends(get_db), current: User = Depends(require_perm("user.create"))):
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=409, detail="用户名已存在")
    obj = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        real_name=payload.real_name,
        mobile=payload.mobile,
        force_change_password=True,
    )
    db.add(obj)
    db.add(AuditLog(biz_type="user", biz_id="new", action="create", operator=current.username, detail=payload.username))
    db.commit()
    return ok({"id": str(obj.id)})
