#!/usr/bin/env python3
"""
Servidor HTTP simple en puerto 5502
"""

import http.server
import socketserver

PORT = 5502

Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"✅ Servidor ejecutándose en http://localhost:{PORT}")
    print(f"📂 Sirviendo archivos desde: {httpd.server_address}")
    print("Presiona Ctrl+C para detener el servidor")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n⚠️ Servidor detenido")
