FROM ghcr.io/get-convex/convex-backend:19431ea0dd90bc55ae58dbbd06d9aa045f97336f@sha256:467964cc6af57ba3e757e3e6cb1fa09a1c577803a19f03f0f42c9c4b134b070c

COPY --chmod=644 services/convex-backend/wait-for-postgres.mjs /convex/wait-for-postgres.mjs
COPY --chmod=755 services/convex-backend/start-with-dependency-wait.sh /convex/start-with-dependency-wait.sh

STOPSIGNAL SIGINT

ENTRYPOINT ["/convex/start-with-dependency-wait.sh"]
