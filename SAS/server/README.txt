SAS SCHOOL ONLINE SERVER - DEBIAN 13

This is an update to the existing SAS relay program. Keep the current sas-online.service and sas-tunnel.service definitions and keep Minecraft Bedrock unchanged. The existing site uses the same relay room name `sas-school` and protocol types `join` and `state`.

For the V7.0.2 client to receive facing, movement animation, scene lift, and short action indicators, update only the Python application file at the already-installed path:
  /home/eyad/Downloads/SAS/online-server/sas_online_server.py

Copy the bundled server/sas_online_server.py there, then restart and inspect only the existing SAS relay service:
  sudo systemctl restart sas-online
  sudo systemctl status sas-online --no-pager
  sudo journalctl -u sas-online -n 60 --no-pager

Do not edit the unit file, stop sas-tunnel, or touch the Minecraft Bedrock service. This package cannot SSH into or modify the OptiPlex itself. The client can still exchange basic name, appearance, position, room, and scene with the older relay, but the older relay drops the new movement and action fields.

The relay uses only Python's standard library and listens on 127.0.0.1:8765. Cloudflare Tunnel must continue forwarding the public wss:// address to that local listener. The address is configured only in sas-online-config.js in the website folder. If the temporary trycloudflare address changes, edit window.SAS_ONLINE_URL there and republish the website.

The server validates/clamps movement values and allows only known action labels. It relays action indicators; it does not simulate or authorize damage, health, ball physics, animal state, or world interactions. Those remain local to each browser in the existing game code. A server-authoritative shared world needs additional game-specific server logic.

For publishing the website, upload every file/folder from the extracted package to the existing HTTPS site without flattening paths. Test with two separate browsers outside the same machine. No live endpoint or Debian deployment is claimed as tested by this package build.
