import stomp
import argparse
import json
import time
import xml.etree.ElementTree as ET

DESTINO = "/queue/pedidos"

def interpretar(cuerpo: str, headers: dict):
    """Interpreta el cuerpo del mensaje basado en los headers."""
    formato = headers.get("x-formato", "").lower()
    tipo_mime = headers.get("content-type", "").lower()
    
    if not formato:
        if "application/json" in tipo_mime:
            formato = "json"
        elif "application/xml" in tipo_mime or "text/xml" in tipo_mime:
            formato = "xml"
        else:
            formato = "texto"
            
    if formato == "json":
        return formato, json.loads(cuerpo)
    elif formato == "xml":
        return formato, ET.fromstring(cuerpo)
    else:
        return formato, cuerpo

class Escuchador(stomp.ConnectionListener):
    def __init__(self, conexion):
        self.conexion = conexion

    def on_error(self, frame):
        print(f"Error del broker: {frame.body}")

    def on_disconnected(self):
        print("Conexión STOMP cerrada")

    def on_message(self, frame):
        ack_id = frame.headers.get("ack")
        try:
            formato, contenido = interpretar(frame.body, frame.headers)
            print(f"\n[RECIBIDO] formato={formato}")
            
            if isinstance(contenido, str):
                print(contenido)
            else:
                # Imprimir JSON o XML de forma legible
                if formato == "json":
                    print(json.dumps(contenido, ensure_ascii=False, indent=2))
                else: # XML
                    print(ET.tostring(contenido, encoding='unicode'))
                    
            self.conexion.ack(id=ack_id)
        except Exception as exc:
            print(f"[Mensaje invalido] {exc}")
            self.conexion.nack(id=ack_id, requeue="false")

def main():
    parser = argparse.ArgumentParser(description="Consumidor STOMP")
    parser.add_argument("--host", default="127.0.0.1", help="Host del broker STOMP")
    parser.add_argument("--port", type=int, default=61613, help="Puerto del broker STOMP")
    parser.add_argument("--usuario", default="demo", help="Usuario del broker")
    parser.add_argument("--clave", default="demo123", help="Contraseña del broker")
    args = parser.parse_args()

    conexion = stomp.Connection12([(args.host, args.port)], vhost="/")
    conexion.set_listener("pedidor", Escuchador(conexion))

    try:
        conexion.connect(args.usuario, args.clave, wait=True)
        conexion.subscribe(
            destination=DESTINO, 
            id="lector-pedidos",
            ack="client-individual", 
            headers={"prefetch-count": 1}
        )
        print(f"Escuchando {DESTINO}. Presiona Ctrl+C para salir.")
        
        while conexion.is_connected():
            time.sleep(0.5)
            
    except KeyboardInterrupt:
        print("\nDeteniendo consumidor...")
    finally:
        if conexion.is_connected():
            conexion.disconnect()

if __name__ == "__main__":
    main()