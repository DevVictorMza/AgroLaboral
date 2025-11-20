#!/usr/bin/env python3
"""
Servidor HTTP con proxy para geocodificación Nominatim
Soluciona problemas de CORS para el frontend
"""

import http.server
import socketserver

# Puerto fijo para el servidor proxy
PORT = 3000
import urllib.request
import urllib.parse
import json
import os
from urllib.error import HTTPError, URLError

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Agregar headers CORS para permitir solicitudes desde cualquier origen
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        # Manejar solicitudes preflight OPTIONS
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        # Manejar solicitudes de geocodificación
        if self.path.startswith('/api/geocoding'):
            self.handle_geocoding()
        else:
            # Servir archivos estáticos normalmente
            super().do_GET()

    def handle_geocoding(self):
        """Proxy para solicitudes de geocodificación a Nominatim"""
        try:
            # Extraer parámetros de la query string
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            
            # Validar que se proporcione la dirección
            if 'q' not in query_params:
                self.send_error(400, "Parámetro 'q' (query) es requerido")
                return

            address = query_params['q'][0]
            
            # Construir URL de Nominatim
            nominatim_params = {
                'format': 'json',
                'q': address,
                'limit': '5',
                'countrycodes': 'ar',
                'addressdetails': '1'
            }
            
            nominatim_url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(nominatim_params)
            
            print(f"🌐 Proxying geocoding request: {address}")
            print(f"🔗 Nominatim URL: {nominatim_url}")
            
            # Realizar solicitud a Nominatim
            with urllib.request.urlopen(nominatim_url) as response:
                data = response.read()
                results = json.loads(data.decode('utf-8'))
            
            # Enviar respuesta al cliente
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response_data = {
                'success': True,
                'results': results,
                'count': len(results)
            }
            
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode('utf-8'))
            print(f"✅ Geocoding successful: {len(results)} results found")
            
        except HTTPError as e:
            print(f"❌ HTTP Error: {e}")
            self.send_error(500, f"Error del servicio de geocodificación: {e}")
            
        except URLError as e:
            print(f"❌ URL Error: {e}")
            self.send_error(500, f"Error de conexión: {e}")
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON Error: {e}")
            self.send_error(500, f"Error al procesar respuesta: {e}")
            
        except Exception as e:
            print(f"❌ Unexpected Error: {e}")
            self.send_error(500, f"Error interno del servidor: {e}")

def run_server():
    """Iniciar servidor con proxy de geocodificación en puerto fijo 3000"""
    try:
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            print(f"🚀 Servidor iniciado en http://localhost:{PORT}")
            print(f"📂 Sirviendo archivos desde: {os.getcwd()}")
            print(f"🌐 Proxy de geocodificación disponible en: /api/geocoding")
            print(f"💡 Para detener el servidor presiona Ctrl+C")
            print("="*60)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario")
    except OSError as e:
        if e.errno == 10048:  # Puerto ya en uso
            print(f"❌ Error: El puerto {PORT} ya está en uso")
            print(f"💡 Intenta con otro puerto o cierra el proceso que lo está usando")
        else:
            print(f"❌ Error del sistema: {e}")

if __name__ == "__main__":
    run_server()