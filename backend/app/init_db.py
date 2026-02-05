from .database import Base, engine, SessionLocal
from .seed import seed_init


def run_init() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_init(db)
    finally:
        db.close()


if __name__ == "__main__":
    run_init()
