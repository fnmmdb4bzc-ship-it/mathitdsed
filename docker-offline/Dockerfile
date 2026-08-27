# Registry-free variant: builds without pulling any base image, for environments
# where container registries (Docker Hub, GHCR, etc.) aren't reachable.
#
# Build first with build.sh (it stages a Node binary + its shared libraries into
# rootfs/), then:
#   docker build -f docker-offline/Dockerfile -t mathit:offline docker-offline
#   docker run --rm -p 8080:8080 mathit:offline
FROM scratch

COPY rootfs/lib /lib
COPY rootfs/lib64 /lib64
COPY rootfs/node /node

COPY server.js /server.js
COPY MathIT.html /MathIT.html

EXPOSE 8080
ENTRYPOINT ["/node", "/server.js"]
