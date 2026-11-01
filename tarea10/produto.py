import stomp
import argparse
import json
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation

DESTINO = "/queue/pedidos"

def construir_mensaje(formato: str, pedido: dict, texto: str) -> tuple[str, str]:
    """Construye el cuerpo y el mime type según el formato elegido."""
    if formato == "texto":
        return texto, "text/plain; charset=utf-8"
    elif formato == "fijo":
        # Formato ancho fijo de ejemplo: ID(10) Cliente(20) Monto(10)
        cuerpo = f"{pedido['id']:<10}{pedido['cliente']:<20}{pedido['monto']:<10}"
        return cuerpo, "text/plain; charset=utf-8"
    elif formato == "json":
        return json.dumps(pedido), "application/json"
    elif formato == "xml":
        root = ET.Element("pedido")
        ET.SubElement(root, "id").text = str(pedido['id'])
        ET.SubElement(root, "cliente").text = str(pedido['cliente'])
        ET.SubElement(root, "monto").text = str(pedido['monto'])
        return ET.tostring(root, encoding='unicode'), "application/xml"
    else:
        raise ValueError(f"Formato no soportado: {formato}")

def main():
    parser = argparse.ArgumentParser(description="Productor STOMP")
    
    # Argumentos
    parser.add_argument("--formato", choices=["texto", "fijo", "xml", "json"], required=True, help="Formato del mensaje")
    parser.add_argument("--mensaje", default="Hola desde el productor STOMP", help="Mensaje si el formato es texto")
    parser.add_argument("--id", default="123", help="ID del pedido")
    parser.add_argument("--cliente", default="Edward Norton", help="Nombre del cliente")
    parser.add_argument("--monto", default="123.45", help="Monto del pedido")
    parser.add_argument("--host", default="127.0.0.1", help="Host del broker STOMP")
    parser.add_argument("--port", type=int, default=61613, help="Puerto del broker STOMP")
    parser.add_argument("--usuario", default="demo", help="Usuario del broker")
    parser.add_argument("--clave", default="demo123", help="Contraseña del broker")

    args = parser.parse_args()

    # Validación del monto
    try:
        monto = Decimal(args.monto)
        if not monto.is_finite():
            raise ValueError("El monto debe ser número finito")
    except InvalidOperation:
        parser.error(f"Monto no válido: {args.monto}")

    # Crear diccionario con los datos
    pedido = {"id": args.id, "cliente": args.cliente, "monto": str(monto)}

    # Construir mensaje
    try:
        cuerpo, mime = construir_mensaje(args.formato, pedido, args.mensaje)
    except ValueError as exc:
        parser.error(str(exc))

    # Conexión y envío
    conexion = stomp.Connection12([(args.host, args.port)], vhost="/")
    
    try:
        conexion.connect(args.usuario, args.clave, wait=True)
        conexion.send(
            destination=DESTINO,
            body=cuerpo,
            headers={
                "content-type": mime,
                "x-formato": args.formato,
                "persistent": "true",
            },
        )
        print(f"Mensaje enviado a {DESTINO} (formato={args.formato})")
    except Exception as e:
        print(f"Error al enviar mensaje: {e}")
    finally:
        if conexion.is_connected():
            conexion.disconnect()

if __name__ == "__main__":
    main()