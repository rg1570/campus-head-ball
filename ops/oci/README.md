# Oracle OCI staging runbook

This folder is independent of Render production; it creates no cloud resource and changes no DNS.

Use Ubuntu ARM64 LTS on `VM.Standard.A1.Flex` (2 OCPU / 12 GB), systemd, and Caddy. Caddy terminates HTTPS/WSS on 80/443 and proxies Node/Socket.IO only on `127.0.0.1:3001`.

After you create the VM manually: create non-root user `kafatopu`; clone to `/opt/campus-head-ball`; install Node 20 ARM64 and Caddy; run `npm ci --omit=dev`; copy `staging.env.example` to `/etc/campus-head-ball/staging.env` with mode `0600`; replace the metrics token only on the VM; install/enable the systemd unit; then configure Caddy with a staging hostname.

OCI NSG and Ubuntu firewall: public 80/tcp and 443/tcp; 22/tcp only from administrator IP; never expose 3001. A real staging hostname and separate DNS record are required for Caddy public TLS—do not alter the production DNS record.

The default A/B method is to open each environment at its own URL; the client then connects to that page's origin. Optional cross-origin testing is enabled only when `GAME_ENDPOINTS_JSON` explicitly maps `?server=<name>` to an HTTPS URL. For example, set `{"render-ab":"https://kafatopu.onrender.com"}` and open staging with `?server=render-ab`; the target must allow the staging page origin through `APP_ORIGIN`. Use this only when that cross-origin configuration is explicitly approved.

`/metrics` requires `Authorization: Bearer <METRICS_TOKEN>` and only returns aggregate process, tick, bot-AI, network, connection, event-loop, and GC data. It contains no room code, player name, token, or raw input.
