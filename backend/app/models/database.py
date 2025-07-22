from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Generate the initial migration - create migration script
# alembic revision --autogenerate -m "init-setup"

# Apply the migration - run on migrations folder
# alembic upgrade head