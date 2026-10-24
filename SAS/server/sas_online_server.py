#!/usr/bin/env python3
"""Small standard-library WebSocket lobby for SAS School; no third-party packages."""
import argparse
import asyncio
import base64
import hashlib
import json
import os
import secrets
import ssl
import struct
import time

GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
MAX_MESSAGE = 65536
MAX_CLIENTS = 40
clients = set()

class Client:
    def __init__(self, writer):
        self.id = secrets.token_urlsafe(9)
        self.writer = writer
        self.room = "sas-school"
        self.player = {}
        self.send_lock = asyncio.Lock()
        self.last_state = 0.0
        self.closed = False

async def send_frame(client, opcode, payload=b""):
    if client.closed or client.writer.is_closing():
        return
    if isinstance(payload, str):
        payload = payload.encode("utf-8")
    size = len(payload)
    if size < 126:
        head = bytes((0x80 | opcode, size))
    elif size <= 65535:
        head = bytes((0x80 | opcode, 126)) + struct.pack("!H", size)
    else:
        head = bytes((0x80 | opcode, 127)) + struct.pack("!Q", size)
    async with client.send_lock:
        client.writer.write(head + payload)
        await client.writer.drain()

async def send_json(client, data):
    await send_frame(client, 1, json.dumps(data, separators=(",", ":"), ensure_ascii=False))

async def read_frame(reader):
    first, second = await reader.readexactly(2)
    fin = bool(first & 0x80)
    opcode = first & 0x0F
    masked = bool(second & 0x80)
    length = second & 0x7F
    if length == 126:
        length = struct.unpack("!H", await reader.readexactly(2))[0]
    elif length == 127:
        length = struct.unpack("!Q", await reader.readexactly(8))[0]
    if length > MAX_MESSAGE:
        raise ValueError("message too large")
    mask = await reader.readexactly(4) if masked else b""
    payload = await reader.readexactly(length)
    if masked:
        payload = bytes(value ^ mask[index & 3] for index, value in enumerate(payload))
    if not fin:
        raise ValueError("fragmented messages are unsupported")
    return opcode, payload

def clean_player(raw, client_id):
    raw = raw if isinstance(raw, dict) else {}
    name = str(raw.get("name", "Student")).strip()[:24] or "Student"
    color = str(raw.get("shirtColor", "#17191d"))
    if len(color) != 7 or color[0] != "#" or any(c not in "0123456789abcdefABCDEF" for c in color[1:]):
        color = "#17191d"
    def number(key, default, low, high):
        try:
            value = float(raw.get(key, default))
            if not (value == value and abs(value) != float("inf")):
                return default
            return max(low, min(high, value))
        except (TypeError, ValueError):
            return default
    action = str(raw.get("action", ""))
    allowed_actions = {"attack", "p1Attack", "p2Attack", "leaderAttack", "p1LeaderAttack", "p2LeaderAttack", "leaderKick", "spear", "p1Spear", "p2Spear", "spearAttack", "learnMagic", "eatFood", "kick", "kick2", "shot", "jump", "helicopterJump", "skydive1", "skydive2", "land", "land1", "land2", "forage", "foricte"}
    if action not in allowed_actions:
        action = ""
    try:
        action_seq = max(0, min(2147483647, int(raw.get("actionSeq", 0))))
    except (TypeError, ValueError):
        action_seq = 0
    scene = str(raw.get("scene", "school"))[:20]
    allowed_scenes = {"school", "soccer", "pool", "run", "sky", "helicopter", "fall", "reaction"}
    if scene not in allowed_scenes:
        scene = "school"
    return {
        "id": client_id, "name": name, "gender": "girl" if raw.get("gender") == "girl" else "boy",
        "shirtColor": color, "x": number("x", 0.0, -100.0, 100.0), "z": number("z", 0.0, -100.0, 100.0),
        "room": str(raw.get("room", "class"))[:20], "scene": scene,
        "walk": number("walk", 0.0, -1000000.0, 1000000.0),
        "moving": bool(raw.get("moving", False)), "facing": number("facing", 0.0, -3.142, 3.142),
        "lift": number("lift", 0.0, 0.0, 100.0), "action": action, "actionSeq": action_seq,
    }

async def broadcast(room, message, skip=None):
    stale = []
    for peer in tuple(clients):
        if peer is skip or peer.room != room or peer.closed:
            continue
        try:
            await send_json(peer, message)
        except (ConnectionError, OSError, asyncio.IncompleteReadError):
            stale.append(peer)
    for peer in stale:
        peer.closed = True
        clients.discard(peer)

async def handle_client(reader, writer):
    client = None
    try:
        if len(clients) >= MAX_CLIENTS:
            writer.close()
            await writer.wait_closed()
            return
        request = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), timeout=8)
        if len(request) > 16384:
            raise ValueError("headers too large")
        headers = {}
        for line in request.decode("latin1").split("\r\n")[1:]:
            if ":" in line:
                key, value = line.split(":", 1)
                headers[key.strip().lower()] = value.strip()
        key = headers.get("sec-websocket-key")
        if not key or headers.get("sec-websocket-version") != "13" or "websocket" not in headers.get("upgrade", "").lower():
            writer.write(b"HTTP/1.1 400 Bad Request\r\nConnection: close\r\nContent-Length: 0\r\n\r\n")
            await writer.drain()
            return
        accept = base64.b64encode(hashlib.sha1((key + GUID).encode("ascii")).digest()).decode("ascii")
        writer.write(("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + accept + "\r\n\r\n").encode("ascii"))
        await writer.drain()
        client = Client(writer)
        clients.add(client)
        while True:
            opcode, data = await read_frame(reader)
            if opcode == 8:
                break
            if opcode == 9:
                await send_frame(client, 10, data)
                continue
            if opcode != 1:
                continue
            try:
                message = json.loads(data.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                await send_json(client, {"type": "error", "message": "Invalid JSON"})
                continue
            if not isinstance(message, dict):
                continue
            kind = message.get("type")
            if kind == "join":
                client.room = str(message.get("room", "sas-school"))[:32] or "sas-school"
                client.player = clean_player(message.get("player"), client.id)
                others = [{"id": p.id, **p.player} for p in clients if p is not client and p.room == client.room and p.player]
                await send_json(client, {"type": "welcome", "id": client.id, "room": client.room, "players": others})
                await broadcast(client.room, {"type": "peer_join", "player": client.player}, skip=client)
            elif kind == "state" and client.player:
                now = time.monotonic()
                if now - client.last_state < 0.04:
                    continue
                client.last_state = now
                client.player = clean_player(message.get("player"), client.id)
                await broadcast(client.room, {"type": "state", "player": client.player}, skip=client)
    except (asyncio.IncompleteReadError, asyncio.TimeoutError, ConnectionError, OSError, ValueError):
        pass
    finally:
        if client is not None:
            was_joined = bool(client.player)
            room = client.room
            client.closed = True
            clients.discard(client)
            if was_joined:
                try:
                    await broadcast(room, {"type": "peer_leave", "id": client.id})
                except Exception:
                    pass
        try:
            writer.close()
            await writer.wait_closed()
        except Exception:
            pass

async def main(args):
    context = None
    if args.cert and args.key:
        context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        context.load_cert_chain(args.cert, args.key)
    elif args.tls_required:
        raise SystemExit("TLS certificate and key are required (or terminate TLS at a reverse proxy).")
    server = await asyncio.start_server(handle_client, args.bind, args.port, ssl=context, limit=MAX_MESSAGE + 16384)
    print("SAS Online server listening on %s:%d%s" % (args.bind, args.port, " with TLS" if context else " behind TLS proxy"))
    async with server:
        await server.serve_forever()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bind", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--cert", default=os.environ.get("SAS_TLS_CERT"))
    parser.add_argument("--key", default=os.environ.get("SAS_TLS_KEY"))
    parser.add_argument("--tls-required", action="store_true")
    asyncio.run(main(parser.parse_args()))
