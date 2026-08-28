#!/usr/bin/env python3
"""Local dev server for MathIT.

Serves MathIT.html at the site root, matching how the app is deployed:
Netlify and the nginx Dockerfile both publish it as index.html. Plain
`python3 -m http.server` shows a directory listing instead, because the
file isn't literally named index.html.

    ./serve.py            # http://localhost:9090/
    ./serve.py 8080       # some other port
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = "MathIT.html"


class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # "/" and "/index.html" both resolve to the app itself; every other
        # path falls through to normal static serving (assets/, build/, the
        # older practice_app*.html prototypes).
        if path.split("?", 1)[0].split("#", 1)[0] in ("/", "/index.html"):
            return str(ROOT / APP)
        return super().translate_path(path)

    def end_headers(self):
        # No caching, so an edit to MathIT.html shows up on a plain reload.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9090
    if not (ROOT / APP).is_file():
        sys.exit(f"{APP} not found in {ROOT}")
    handler = partial(Handler, directory=str(ROOT))
    with ThreadingHTTPServer(("", port), handler) as httpd:
        print(f"MathIT serving at http://localhost:{port}/  (Ctrl-C to stop)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")


if __name__ == "__main__":
    main()
