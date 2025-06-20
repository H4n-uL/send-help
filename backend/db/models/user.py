from sqlalchemy import Column, VARCHAR
from sqlalchemy.orm import relationship
from ..base import Base

class User(Base):
    __tablename__ = "user"
    id = Column(VARCHAR(255), primary_key=True, nullable=False)
    userid = Column(VARCHAR(255), nullable=False)
    password = Column(VARCHAR(255), nullable=False)
    posts = relationship("Post", back_populates="user")
    comments = relationship("Comment", back_populates="user")
