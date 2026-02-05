#!/usr/bin/env python
import os
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import User
from app.security import hash_password


def main():
    username = os.getenv("INIT_ADMIN_USERNAME", "admin")
    password = os.getenv("INIT_ADMIN_PASSWORD", "Admin@12345")
    real_name = os.getenv("INIT_ADMIN_REAL_NAME", "系统管理员")

    db: Session = SessionLocal()
    try:
        exists = db.query(User).filter(User.username == username).first()
        if exists:
            print(f"admin exists: {username}")
            return
        db.add(User(username=username, password_hash=hash_password(password), real_name=real_name, mobile="13800000000", force_change_password=True))
        db.commit()
        print(f"admin created: {username}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
