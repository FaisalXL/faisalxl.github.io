#!/usr/bin/env python3
"""Local preview server that never caches.

`python3 -m http.server` sends no cache headers at all, so browsers apply their
own heuristic freshness and happily serve a stale styles.css or script.js after
you've edited it — you change something, reload, and see nothing happen.

This is the same static server with `Cache-Control: no-store` on every response.

    python3 tools/serve.py            # http://localhost:8080
    python3 tools/serve.py 9000       # a different port

Only for local editing. It has nothing to do with how the site is deployed.
"""
import functools
import http.server
import os
import pathlib
import socketserver
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    os.chdir(ROOT)
    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"Serving {ROOT} at http://localhost:{port}  (no-store; edits show on reload)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
