from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..errors import ok
from ..models import User
from ..rbac import get_user_roles, get_user_permissions
from ..schemas import LoginIn
from ..security import verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    token = create_access_token(str(user.id))
    return ok({
        "access_token": token,
        "token_type": "bearer",
        "force_change_password": user.force_change_password,
    })


@router.get("/me")
def me(current: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roles = get_user_roles(db, str(current.id))
    perms = get_user_permissions(db, str(current.id))
    menus = [
        "dashboard", "system/users", "leads", "customers"
    ] if "super_admin" in roles else ["dashboard", "leads", "customers"]
    return ok({
        "id": str(current.id),
        "username": current.username,
        "real_name": current.real_name,
        "roles": roles,
        "permissions": perms,
        "menus": menus,
    })
