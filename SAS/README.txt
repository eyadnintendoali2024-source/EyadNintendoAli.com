SAS SCHOOL ADVENTURE 3D - VERSION 7.0.2

RUN
1. Extract the entire ZIP.
2. Open index.html or SAS.html in Chrome or Edge. Do not separate the HTML from its asset folders.
3. Android 8: extract the complete folder, then open index.html in the browser. If the browser restricts local files, publish the folder over your existing HTTPS website.

ONLINE PLAY
Choose ONLINE on the home menu. The existing setup screen keeps player name, class, gender, and shirt-color customization. Continue creates or updates the local student, then connects automatically to the configured WSS endpoint; there is no IP, URL, or room-code field. When the server accepts the player, the existing SAS game starts. Other connected students are drawn in the existing WebGL game, their names appear above them, and movement/facing/animation plus whitelisted action indicators are relayed. A drop in connection triggers automatic reconnect. Disconnect returns the game to offline operation.

The temporary endpoint is defined once in sas-online-config.js as window.SAS_ONLINE_URL. The free temporary tunnel URL can expire; if it changes, edit that one setting and republish the file. No server address is typed by players.

PUBLISHING THE WEBSITE
Upload all files and folders from this extracted package to the same website directory, including SAS.html, sas-online.js, sas-online-config.js, sas_compat.js, audio/, lesson/, and images. Keep relative paths intact. Publish through HTTPS because browsers require WSS for online play.

SAS RELAY COMPATIBILITY
The bundled server/sas_online_server.py accepts the expanded movement and action-visual fields. The old deployed relay only forwards name, color, position, room, and scene; it drops the newer movement/facing/action fields. To enable those fields, copy the bundled server/sas_online_server.py to /home/eyad/Downloads/SAS/online-server/sas_online_server.py and restart only the existing SAS service with sudo systemctl restart sas-online. Do not replace the systemd unit or touch sas-tunnel or Minecraft Bedrock. This package does not connect to your Debian machine or deploy the update itself.

GAMEPLAY SYNC LIMIT
The existing SAS gameplay runs locally in each browser and the deployed server has no authoritative school world, shared ball/animal/health model, or game-result validation. This update relays player presence, position, appearance, facing, movement state, and short whitelisted action indicators. Attacks/abilities are visual notices only: damage, health, ball physics, quiz results, and world changes are not shared/authoritative across clients. Completing those mechanics requires adding server-side world/game-state logic; do not treat these action indicators as trusted results. Offline gameplay is unchanged.

TESTING
JavaScript and bundled Python syntax checks and static integration checks were run. No live website, current Cloudflare tunnel, Android 8 device, Smart Board, or Debian OptiPlex was available here. Two-device online gameplay therefore still needs a real browser test after publishing and updating the relay.
