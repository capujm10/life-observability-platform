from app.core.config import get_settings
from app.core.database import SessionLocal
from app.services.seed import seed_demo_data


def main() -> None:
    settings = get_settings()
    with SessionLocal() as session:
        seed_demo_data(session, settings.demo_user_email, settings.demo_user_password)


if __name__ == "__main__":
    main()

