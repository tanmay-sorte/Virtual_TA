from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from src.db_connection import get_db
from passlib.context import CryptContext
# from src.models.my_logger import logger

# # --------------------- JWT ------------------ #

# class Settings(BaseSettings):
#     JWT_SECRET_KEY : str
#     JWT_ALGORITHM : str = "HS256"
#     ACCESS_TOKEN_EXPIRY_MINTUES : int = 30
#     REFRESH_TOKEN_EXPIRY_MINUTES : int =  60*24*7

#     class Config:
#         env_file = ".env"


# setting = Settings()

# from datetime import datetime, timedelta
# from typing import Any, Dict
# from passlib.context import CryptContext
# from jose import jwt, JWTError

pwd_context = CryptContext(schemes=["bcrypt"], deprecated = "auto")

    
# def hash_password(plain: str) -> str:
#     return pwd_context.hash(plain)

# def verify_password(plain: str, password_hash: str) -> bool:
#     return pwd_context.verify(plain, password_hash)

# def _create_token(claims: Dict[str, Any], minutes: int) -> str:
#     to_encode = claims.copy()
#     to_encode["exp"] = datetime.now() + timedelta(minutes=minutes)
#     return jwt.encode(to_encode, setting.JWT_SECRET_KEY, algorithm=setting.JWT_ALGORITHM)

# def create_access_token(sub: str, role: str) -> str:
#     return _create_token({"sub": sub, "role": role, "type": "access"},
#                          setting.ACCESS_TOKEN_EXPIRE_MINUTES)

# def create_refresh_token(sub: str, role: str) -> str:
#     return _create_token({"sub": sub, "role": role, "type": "refresh"},
#                          setting.REFRESH_TOKEN_EXPIRE_MINUTES)

# ------------------ API Schema --------------

router = APIRouter(prefix="/v1/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: EmailStr
    password: str


@router.post("/login")
def login(request: LoginRequest):
    
    """
    Validates user credentials.
    """

    db = get_db()
    users_collection = db["users"]

    email = request.username.lower().strip()

    user = users_collection.find_one({"email": email})
    if not user:
        # Do NOT reveal whether the email exists
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Verify password hash
    stored_hash = user.get("password_hash", "")
    if not stored_hash or not pwd_context.verify(request.password, stored_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")


    # extra_info = {
    #     # "exception_type": "LoginSucces",
    #     "status_code": 200,
    #     "tags": ["login", "startup", "success"]
    # }
    # logger.info("Authentication of User successful!", extra=extra_info)

    return {
        "status": "success",
        "message": "Login successful",
        "user": {
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role", "recruiter")
        }
        
    }

# from fastapi import APIRouter, HTTPException, status, Request, Response
# from pydantic import BaseModel, EmailStr
# from src.db_connection import get_db
# from passlib.context import CryptContext

# # --------------------- Password Hashing ------------------ #
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# # --------------------- JWT Basics ------------------------ #
# import os
# from datetime import datetime, timedelta, timezone
# from jose import jwt, JWTError

# # Environment-driven settings with safe defaults for dev
# JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "CHANGE_ME_IN_PROD")
# JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
# ACCESS_TOKEN_TTL_MIN = int(os.getenv("ACCESS_TOKEN_TTL_MIN", "10"))     # short-lived
# REFRESH_TOKEN_TTL_DAYS = int(os.getenv("REFRESH_TOKEN_TTL_DAYS", "7"))  # longer-lived

# # In local HTTP dev, cookies can't be Secure; in prod keep Secure=True
# SECURE_COOKIES = os.getenv("SECURE_COOKIES", "false").lower() in ("1", "true", "yes")

# COOKIE_OPTS = dict(
#     httponly=True,
#     secure=SECURE_COOKIES,  # set True in production with HTTPS
#     samesite="lax",
#     path="/",
# )

# def _create_token(*, sub: str, role: str, name: str, typ: str, minutes: int | None = None, days: int | None = None) -> str:
#     now = datetime.now(timezone.utc)
#     if minutes is not None:
#         exp = now + timedelta(minutes=minutes)
#     else:
#         exp = now + timedelta(days=days or 0)

#     payload = {
#         "sub": sub,          # email as subject
#         "role": role,        # simple role
#         "name": name,        # display name
#         "typ": typ,          # "access" | "refresh"
#         "iat": int(now.timestamp()),
#         "exp": int(exp.timestamp()),
#     }
#     return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

# def _issue_session_cookies(res: Response, *, email: str, role: str, name: str):
#     access = _create_token(sub=email, role=role, name=name, typ="access", minutes=ACCESS_TOKEN_TTL_MIN)
#     refresh = _create_token(sub=email, role=role, name=name, typ="refresh", days=REFRESH_TOKEN_TTL_DAYS)
#     res.set_cookie("access", access, max_age=ACCESS_TOKEN_TTL_MIN * 60, **COOKIE_OPTS)
#     res.set_cookie("refresh", refresh, max_age=REFRESH_TOKEN_TTL_DAYS * 24 * 3600, **COOKIE_OPTS)

# def _clear_session_cookies(res: Response):
#     res.delete_cookie("access", path="/")
#     res.delete_cookie("refresh", path="/")

# def _verify_cookie_token(req: Request, *, typ: str):
#     cookie_name = "access" if typ == "access" else "refresh"
#     token = req.cookies.get(cookie_name)
#     if not token:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
#     try:
#         payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
#         if payload.get("typ") != typ:
#             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
#         return payload
#     except JWTError:
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")


# # ------------------ API Schema & Router ------------------ #

# router = APIRouter(prefix="/v1/auth", tags=["Authentication"])

# class LoginRequest(BaseModel):
#     username: EmailStr
#     password: str


# @router.post("/login")
# def login(request: LoginRequest, response: Response):
#     """
#     Validates user credentials, sets HTTP-only cookies for access/refresh tokens,
#     and returns basic user info.
#     """
#     db = get_db()
#     users_collection = db["users"]

#     email = request.username.lower().strip()

#     user = users_collection.find_one({"email": email})
#     if not user:
#         # Do NOT reveal whether the email exists
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

#     # Verify password hash
#     stored_hash = user.get("password_hash", "")
#     if not stored_hash or not pwd_context.verify(request.password, stored_hash):
#         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

#     name = user.get("name") or email
#     role = user.get("role", "recruiter")

#     # Issue cookies
#     _issue_session_cookies(response, email=email, role=role, name=name)

#     return {
#         "status": "success",
#         "message": "Login successful",
#         "user": {
#             "name": name,
#             "email": email,
#             "role": role,
#         },
#     }


# @router.get("/me")
# def me(req: Request):
#     """
#     Returns the current authenticated user (based on the access cookie).
#     """
#     payload = _verify_cookie_token(req, typ="access")
#     return {
#         "user": {
#             "name": payload.get("name"),
#             "email": payload.get("sub"),
#             "role": payload.get("role", "recruiter"),
#         }
#     }


# @router.post("/refresh")
# def refresh(req: Request, res: Response):
#     """
#     Rotates a new access token using the refresh cookie.
#     """
#     payload = _verify_cookie_token(req, typ="refresh")
#     email = payload.get("sub")
#     role = payload.get("role", "recruiter")
#     name = payload.get("name", email)

#     # Only rotate ACCESS here; you can also rotate refresh if you want stricter security
#     access = _create_token(sub=email, role=role, name=name, typ="access", minutes=ACCESS_TOKEN_TTL_MIN)
#     res.set_cookie("access", access, max_age=ACCESS_TOKEN_TTL_MIN * 60, **COOKIE_OPTS)
#     return {"ok": True}


# @router.post("/logout")
# def logout(res: Response):
#     """
#     Clears session cookies.
#     """
#     _clear_session_cookies(res)
#     return {"ok": True}