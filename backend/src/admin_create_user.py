from passlib.context import CryptContext
from datetime import datetime
from models.user import UserInDB
from db_connection import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# If bcrypt gives issues on Windows, use:
# pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def create_user(name: str, email: str, password: str, role: str = "Recruiter", created_by: str = "admin"):
    db = get_db()
    users_collection = db["users"]

    # Check if email already exists
    if users_collection.find_one({"email": email}):
        print("[ERROR] A user with this email already exists.")
        return

    # Hash password
    password_hash = pwd_context.hash(password)

    # Build the document via your Pydantic model
    user = UserInDB(
        name=name,
        email=email,
        password_hash=password_hash,
        role=role,
        created_by=created_by,
        created_at=datetime.now(),
        modified_at=datetime.now()
    )

    # Insert using the same collection variable
    users_collection.insert_one(user.dict())

    print(f"[SUCCESS] User {email} created")

if __name__ == "__main__":
    create_user(
        name="Recruiter",
        email="recruiter.test@ra.com",
        password="Pass1234",
        role="recruiter",
        created_by="admin",
    )