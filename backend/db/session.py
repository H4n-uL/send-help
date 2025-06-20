from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .base_class import Base
from .models.post import Post
from .models.user import User
from .models.comment import Comment

DATABASE_URL = "postgresql://{user}:{password}@{host}:{port}/{database}?options=-csearch_path%3D{schema}".format(
    user = "not2wing",
    password = "skrdla1",
    host = "localhost", 
    port = "5432",
    database = "mydb",
    schema = "board"
)

db_engine = create_engine(url=DATABASE_URL, pool_size=50, max_overflow=50, echo=True)
Base.metadata.create_all(bind=db_engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
