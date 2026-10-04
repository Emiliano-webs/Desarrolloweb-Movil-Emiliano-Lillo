import time
import httpx

BASE = "http://localhost:8100"


def login(usuario, clave):
    r = httpx.post(f"{BASE}/auth/login", json={"usuario": usuario, "clave": clave})
    r.raise_for_status()
    return r.json()


def pedir_perfil(tokens):
    """Pide /perfil. Si el access_token venció, lo renueva solo con el refresh_token y reintenta una vez."""
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    r = httpx.get(f"{BASE}/perfil", headers=headers)

    if r.status_code == 401 and r.json().get("detail", {}).get("error") == "token_expirado":
        print("  (access_token vencido, renovando con el refresh_token...)")
        nuevo = httpx.post(f"{BASE}/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
        nuevo.raise_for_status()
        tokens.update(nuevo.json())  # guarda el access_token y refresh_token nuevos
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        r = httpx.get(f"{BASE}/perfil", headers=headers)

    r.raise_for_status()
    return r.json(), tokens


if __name__ == "__main__":
    tokens = login("mimi", "1234")
    print("Login ok, access_token expira en", tokens["expires_in"], "segundos")

    datos, tokens = pedir_perfil(tokens)
    print("Pedido inmediato:", datos)

    espera = tokens["expires_in"] + 2
    print(f"Esperando {espera}s a que expire el access_token...")
    time.sleep(espera)

    datos, tokens = pedir_perfil(tokens)
    print("Pedido después de expirar (con auto-refresh):", datos)