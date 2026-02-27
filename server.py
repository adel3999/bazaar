#!/usr/bin/env python3
"""سيرفر تجريبي بسيط - ضع الملفات في نفس المجلد وشغّل هذا الملف"""
import http.server
import socketserver
import os

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map['.js'] = 'application/javascript'

print(f"🚀 السيرفر يعمل على: http://localhost:{PORT}")
print("لإيقافه: Ctrl+C")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
