#!/usr/bin/env bash
# Stages a local Node.js binary and its shared-library dependencies into
# docker-offline/rootfs/, then builds mathit:offline from Dockerfile in this
# directory. Run from anywhere; only needs `node` and `ldd` on the host PATH.
set -euo pipefail
cd "$(dirname "$0")"

NODE_BIN="$(command -v node)"
DEST="rootfs"
rm -rf "$DEST"
mkdir -p "$DEST/lib64"

for lib in $(ldd "$NODE_BIN" | awk '{print $3}' | grep '^/'); do
  real="$(readlink -f "$lib")"
  target="$DEST$(dirname "$lib")"
  mkdir -p "$target"
  cp -L "$real" "$target/$(basename "$lib")"
done
# ld-linux is reported without a "=>" by ldd, grab it separately
loader="$(ldd "$NODE_BIN" | grep 'ld-linux' | awk '{print $1}')"
cp -L "$(readlink -f "$loader")" "$DEST/lib64/$(basename "$loader")"

cp -L "$NODE_BIN" "$DEST/node"
cp -f ../MathIT.html .

docker build -f Dockerfile -t mathit:offline .
echo "Built mathit:offline — run with: docker run --rm -p 8080:8080 mathit:offline"
