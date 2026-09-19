# Two stages: precompress everything once at build time, then serve it. The
# runtime image has no shell task to do and no build tool in it.
#
# OUTDIR is the directory the build produced; it is baked in rather than mounted,
# so the image is the unit that gets pinned, verified and rolled back.
ARG OUTDIR=dist

FROM alpine:3.22 AS compress
ARG OUTDIR
WORKDIR /srv
COPY ${OUTDIR} /srv
# Brotli for the edge, gzip for anything that cannot take it. Caddy serves the
# precompressed file when the request allows, so nothing is compressed per
# request.
RUN apk add --no-cache brotli gzip \
 && find /srv -type f \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.json' -o -name '*.svg' -o -name '*.xml' -o -name '*.txt' \) \
      -exec brotli -q 11 -k {} \; -exec gzip -9 -k {} \;

FROM caddy:2.9-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=compress /srv /srv
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
