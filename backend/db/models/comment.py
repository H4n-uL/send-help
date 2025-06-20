from sqlalchemy import Column, VARCHAR, DATETIME, BIGINT, ForeignKey
from sqlalchemy.orm import relationship
from ..base import Base

class Comment(Base):
    __tablename__ = "comment"
    id = Column(BIGINT, primary_key=True, autoincrement=True, nullable=False)
    contents = Column(VARCHAR(65535), nullable=False)
    date = Column(DATETIME, nullable=False)
    user_id = Column(VARCHAR(255), ForeignKey('user.id'), nullable=False)
    user = relationship("User", back_populates="comments")
    post_id = Column(BIGINT, ForeignKey('post.id'), nullable=False)
    post = relationship("Post", back_populates="comments")
