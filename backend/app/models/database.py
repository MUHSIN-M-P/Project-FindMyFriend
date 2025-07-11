from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Generate the initial migration
# alembic revision --autogenerate -m "init-setup"

# Apply the migration
# alembic upgrade head