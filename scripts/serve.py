#!/usr/bin/env python3
"""Serve only course documents and workbench assets on localhost."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DIRECTORIES = {'site', 'docs', 'modules', 'assessments', 'projects', 'templates', 'progress'}
ROOT_FILES = {'README.md', 'START_HERE.md', 'CONTRIBUTING.md', 'LICENSE.md'}
EXTENSIONS = {'.md', '.html', '.css', '.mjs', '.js', '.svg'}


def public_file(request_path):
    raw = unquote(urlsplit(request_path).path)
    if raw == '/':
        raw = '/site/index.html'
    elif raw == '/site/':
        raw += 'index.html'
    path = (ROOT / raw.lstrip('/')).resolve()
    if not path.is_relative_to(ROOT):
        return None
    relative = path.relative_to(ROOT)
    if any(part.startswith('.') or part == 'private' for part in relative.parts):
        return None
    if not relative.parts or path.suffix not in EXTENSIONS:
        return None
    allowed = str(relative) in ROOT_FILES or relative.parts[0] in DIRECTORIES
    return path if allowed and path.is_file() else None


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(302)
            self.send_header('Location', '/site/')
            self.end_headers()
            return
        self.deliver(False)

    def do_HEAD(self):
        self.deliver(True)

    def deliver(self, head):
        path = public_file(self.path)
        if path is None:
            self.send_error(404)
            return
        data = path.read_bytes()
        types = {'.mjs': 'text/javascript', '.md': 'text/plain; charset=utf-8'}
        self.send_response(200)
        self.send_header('Content-Type', types.get(path.suffix, self.guess_type(str(path))))
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        if not head:
            self.wfile.write(data)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'LLM Training Lab: http://127.0.0.1:{args.port}/site/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
