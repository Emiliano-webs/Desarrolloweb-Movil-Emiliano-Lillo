import os
import time
import jwt
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

app = FastAPI(title="Autenticador con tokens y expiración")

SECRET_KEY = os.getenv("JWT_SECRET", "cambia-este-secreto-por-uno-largo")
ALGORITHM = "HS256"
ACCESS_TOKEN_TTL = int(os.getenv("ACCESS_TOKEN_TTL", "30"))        # segundos
REFRESH_TOKEN_TTL = int(os.getenv("REFRESH_TOKEN_TTL", "3600"))    # segundos (1 hora)

security = HTTPBearer(auto_error=False)

# "Base de datos" de usuarios, en memoria, solo para la demo
usuarios = {"mimi": "1234"}


class LoginRequest(BaseModel):
    usuario: str
    clave: str


class RefreshRequest(BaseModel):
    refresh_token: str


def crear_token(usuario: str, tipo: str, ttl_segundos: int) -> str:
    """tipo es 'access' o 'refresh', para no confundir uno con el otro al decodificar."""
    ahora = int(time.time())
    payload = {
        "sub": usuario,
        "type": tipo,
        "iat": ahora,
        "exp": ahora + ttl_segundos,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decodificar_token(token: str, tipo_esperado: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        # Código de error específico: así el cliente sabe que debe refrescar,
        # y no que el token sea inválido de otra forma.
        raise HTTPException(status_code=401, detail={"error": "token_expirado"})
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail={"error": "token_invalido"})

    if payload.get("type") != tipo_esperado:
        raise HTTPException(status_code=401, detail={"error": "tipo_de_token_incorrecto"})
    return payload


@app.post("/auth/login")
def login(datos: LoginRequest):
    clave_real = usuarios.get(datos.usuario)
    if clave_real != datos.clave:
        raise HTTPException(status_code=401, detail="Usuario o clave incorrectos")

    return {
        "access_token": crear_token(datos.usuario, "access", ACCESS_TOKEN_TTL),
        "refresh_token": crear_token(datos.usuario, "refresh", REFRESH_TOKEN_TTL),
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_TTL,
    }


@app.post("/auth/refresh")
def refresh(datos: RefreshRequest):
    payload = decodificar_token(datos.refresh_token, tipo_esperado="refresh")
    usuario = payload["sub"]

    # Rotamos los dos tokens: cada refresh entrega un access_token Y un refresh_token nuevos.
    # Así, si alguien roba un refresh_token viejo, ya no sirve una vez que se usó.
    return {
        "access_token": crear_token(usuario, "access", ACCESS_TOKEN_TTL),
        "refresh_token": crear_token(usuario, "refresh", REFRESH_TOKEN_TTL),
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_TTL,
    }


def usuario_actual(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    if credentials is None:
        raise HTTPException(status_code=401, detail={"error": "token_requerido"})
    payload = decodificar_token(credentials.credentials, tipo_esperado="access")
    return payload["sub"]


@app.get("/perfil")
def perfil(usuario: str = Depends(usuario_actual)):
    return {"usuario": usuario, "mensaje": "Token vigente, acceso concedido"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)