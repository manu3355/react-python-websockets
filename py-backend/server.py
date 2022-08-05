#!/usr/bin/env python

import asyncio
import json
from uuid import uuid4
import websockets

all_connections = set()
id_con_dict = {}


def editors_val(mid):
    return json.dumps({
        "event": "editors",
        "data": {
            "machine_id": mid,
            "editors": list(editors[mid])
        }
    })


def removeFromEditors(id):
    removedFrom = set()
    for ed in editors:
        if id in editors[ed]:
            editors[ed].remove(id)
            removedFrom.add(ed)
    return removedFrom


def socketsForMachine(mid):
    if mid not in editors:
        return []

    sockets = []
    for ed in editors[mid]:
        if ed in id_con_dict:
            if id_con_dict[ed] == None:
                continue
            sockets.append(id_con_dict[ed])
    return sockets


channels = {}
editors = {}


async def handleMachineEdit(websocket, data, id):
    removedFrom = removeFromEditors(id)
    m_id = data["data"]
    if(m_id not in editors):
        editors[m_id] = set()
    editors[m_id].add(id)
    await websocket.send("already in editors" if m_id in removedFrom else "added you to editors")
    websockets.broadcast(socketsForMachine(m_id), editors_val(m_id))
    for m in removedFrom:
        if m != m_id:
            websockets.broadcast(socketsForMachine(m), editors_val(m))


async def handleSubscribeEvent(websocket, data):
    channel = data["data"]
    if channel not in channels:
        channels[channel] = set()
    channels[channel].add(websocket)


async def echo(websocket):
    print("new serve")
    id = str(uuid4())
    all_connections.add(websocket)
    id_con_dict[id] = websocket
    async for message in websocket:
        data = json.loads(message)
        if "event" in data:
            if(data["event"] == "machine:edit"):
                await handleMachineEdit(websocket, data, id)
            if(data["event"] == "subscribe"):
                await handleSubscribeEvent(websocket, data)

    print("end serve")
    all_connections.remove(websocket)
    del id_con_dict[id]
    removedFrom = removeFromEditors(id)
    for m in removedFrom:
        websockets.broadcast(socketsForMachine(m), editors_val(m))


async def main():
    async with websockets.serve(echo, "localhost", 8765):
        await asyncio.Future()  # run forever

asyncio.run(main())
