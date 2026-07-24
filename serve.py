import http.server
import os
import sys

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.exists(path) and not os.path.isdir(path):
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        self.path = '/index.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

port = int(sys.argv[1]) if len(sys.argv) > 1 else 3000
with http.server.HTTPServer(('127.0.0.1', port), SPAHandler) as httpd:
    print(f'Servidor SPA rodando em http://127.0.0.1:{port}')
    httpd.serve_forever()
