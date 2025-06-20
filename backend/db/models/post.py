from sqlalchemy import Column, VARCHAR, BIGINT, ForeignKey, DATETIME
from sqlalchemy.orm import relationship
from ..base import Base

class Post(Base):
    __tableName__ = "post"
    id = Column(BIGINT, primary_key=True, autoincrement=True, nullable=False)
    title = Column(VARCHAR(4095), nullable=False)
    contents = Column(VARCHAR(1048575), nullable=False)
    date = Column(DATETIME, nullable=False)
    user_id = Column(VARCHAR(255), ForeignKey('user.id'), nullable=False)
    user = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post")
