#!/usr/bin/env python
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Lead, Customer


def main():
    db: Session = SessionLocal()
    try:
        if db.query(Lead).count() == 0:
            db.add_all([
                Lead(name="张三", mobile="13900000001", source="抖音"),
                Lead(name="李四", mobile="13900000002", source="小红书"),
            ])
        if db.query(Customer).count() == 0:
            db.add(Customer(name="王五", mobile="13900000003", wechat="wx_13900000003", address="佛山市禅城区"))
        db.commit()
        print("demo data seeded")
    finally:
        db.close()


if __name__ == "__main__":
    main()
