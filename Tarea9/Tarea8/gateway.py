import os
import secrets
import httpx

# Vault Server - Backend

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Request,
    Response,
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

app = FastAPI(title="Local API Gateway")

security = HTTPBearer(
    auto_error=False
)

BACKEND_URL = "http://localhost:9000"   # fastapi
BACKEND_URL2 = "http://localhost:9100"  # fastapi2

VAULT_ADDR = os.getenv(  # SELINUX
    "VAULT_ADDR", "http://localhost:8200"
)

VAULT_TOKEN = os.getenv(
    "VAULT_TOKEN"  # dev-only-token
)

if not VAULT_TOKEN:
    raise RuntimeError(
        "VAULT TOKEN no está configurado"
    )


async def get_gateway_secrets():
    url = (
        f"{VAULT_ADDR}"  # http://localhost:8200
        "/v1/secret/data/gateway"
    )
    headers = {
        "X-Vault-Token": VAULT_TOKEN  # dev-only-token
    }
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(
            url,
            headers=headers
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"No fue posible acceder a Vault: {response}"
        )
    vault_response = response.json()
    return vault_response["data"]["data"]


async def authenticate_client(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Bearer token requerido"
        )
    vault_secrets = (
        await get_gateway_secrets()  # client_token backend_shared_secret
    )
    expected_token = vault_secrets["client_token"]
    received_token = credentials.credentials
    valid = secrets.compare_digest(received_token, expected_token)
    if not valid:
        raise HTTPException(status_code=401, detail="Token Inválido")
    return {
        "client_id": "student-client",  # Servicios Autenticacion e identificación del usuario
        "backend_secret": vault_secrets["backend_shared_secret"]
    }


@app.api_route(
    "/api/{path:path}",  # product health orders
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"]
)
async def proxy(
    path: str,
    request: Request,
    auth=Depends(authenticate_client)
):
    target_url = (
        f"{BACKEND_URL}/{path}"  # Call http://localhost:8000/api/products -> http://localhost:9000/products
    )
    body = await request.body()
    gateway_headers = {
        "X-Gateway-Secret":
            auth["backend_secret"],  # gateway-api-secret-456
        "X-Authenticated-Client":
            auth["client_id"]  # student-client -> Autenticador
    }
    content_type = request.headers.get("content-type")
    if content_type:
        gateway_headers["content-type"] = content_type

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.request(
            method=request.method,
            url=target_url,
            headers=gateway_headers,
            content=body,
            params=dict(request.query_params),
        )

    return Response(
        content=response.content,
        status_code=response.status_code,
        media_type=response.headers.get("content-type"),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    