import * as http from "http";
import * as express from "express";
import * as WebSocket from "ws";
import { getLogger } from "../server/log";

import { ClientMessage, ServerMessage, _ServerMessage, MessageType } from "./messages";

const log = getLogger();

namespace Connections {

    // used to assign a unique id to connections
    let connectionCount = 0;

    const activeConnection = new Map<WebSocket, number>();

    export function onConnected(socket: WebSocket, path: string) {

        if (path === "/plato") {
            acceptConnection(socket);
        } else {
            log.warn(`unrecognized websocket connection: ${path}`);
            socket.close();
        }
    }

    function acceptConnection(ws: WebSocket) {

        ws.onmessage = ({ data, type, target }) => {
            handleWsMessage(ws, data);
        };

        ws.onclose = (ev) => {
            freeConnection(ws, true);
        };

        ws.onerror = (ev) => {
            log.warn("websocket error", ev);
            freeConnection(ws, false);
        };

        activeConnection.set(ws, ++connectionCount);
        logConnectionStats();
    }

    function handleWsMessage(ws: WebSocket, data: WebSocket.Data) {
        try {
            const msg: ClientMessage = JSON.parse(data.toString());

            log.verbose("got message", data);
            Chat.handleClientMessage(ws, msg);
        } catch (e) {
            log.warn(`error handling message`, e);
        }
    }

    function freeConnection(ws: WebSocket, alreadyClosed: boolean) {
        if (!isAlive(ws)) {
            log.warn(`unknown connection, cannot free`);
            return;
        }

        activeConnection.delete(ws);
        logConnectionStats();

        try {
            if (!alreadyClosed) {
                ws.close();
            }
        } catch (e) {
            log.warn("error finalizing websocket", e);
        }
    }

    export function isAlive(ws: WebSocket) {
        return activeConnection.has(ws);
    }

    export function sendMessage(ws: WebSocket, message: ServerMessage) {

        try {
            ws.send(JSON.stringify(message));
            log.verbose(`sendMessage`, message);
        } catch (e) {
            log.warn(`sendMessage`, e);
            freeConnection(ws, false);
        }
    }

    function logConnectionStats() {
        log.info(`${activeConnection.size} active connections`);
    }

    function ping() {
        const toDelete: WebSocket[] = [];
        for (const c of Array.from(activeConnection.keys())) {
            try {
                sendMessage(c, { type: MessageType.PingPong });
            } catch (e) {
                toDelete.push(c);
            }
        }
        for (const c of toDelete) {
            freeConnection(c, false);
        }
    }

    let pingTimer: any = undefined;
    export function startPing() {
        if (pingTimer === undefined) {
            pingTimer = setInterval(ping, 10e3);
        }
    }
}

namespace Chat {
    // 1-1 mapping of nickname -- socket
    const registered = new Map<string, WebSocket>();
    const nicknames = new Map<WebSocket, string>();

    // 1-n mapping of socket - channel
    const subscriptions = new Map<string, Set<WebSocket>>();

    export function handleClientMessage(ws: WebSocket, msg: ClientMessage) {
        if (msg.type === MessageType.Register) {
            register(ws, msg);
        } else if (msg.type === MessageType.Join) {
            subscribe(ws, msg);
        } else if (msg.type === MessageType.Leave) {
            unsubscribe(ws, msg);
        } else if (msg.type === MessageType.SendChat) {
            handleChatMessage(ws, msg);
        } else if (msg.type === MessageType.PingPong) {

        } else {
            log.warn(`cannot recognized message`, msg);
        }
    }

    function sendMessage(ws: WebSocket, msg: ServerMessage) {
        try {
            Connections.sendMessage(ws, msg);
        } catch (e) {
            unregister(ws);
        }
    }

    function register(ws: WebSocket, msg: ClientMessage) {
        let reason = "internal error";

        if (msg.type === MessageType.Register && msg.nickname) {
            if (nickFor(ws)) {
                reason = "already registered";
            } else if (registered.has(msg.nickname)
                && Connections.isAlive(registered.get(msg.nickname))) {
                reason = "nickname occupied";
            } else {
                registered.set(msg.nickname, ws);
                nicknames.set(ws, msg.nickname);
                reason = null;
            }
        }

        sendMessage(ws, {
            type: MessageType.Register,
            seq: msg.seq,
            succeeded: !reason,
            reason: reason || undefined,
        });
    }

    function subscribe(ws: WebSocket, msg: ClientMessage) {
        let reason = "internal error";

        if (msg.type === MessageType.Join && msg.channelName) {
            if (!nickFor(ws)) {
                reason = "not registered";
            } else {
                let subscribers = subscriptions.get(msg.channelName);
                if (!subscribers) {
                    subscriptions.set(msg.channelName, subscribers = new Set<WebSocket>());
                }
                subscribers.add(ws);
                reason = null;
            }
        }

        sendMessage(ws, {
            type: MessageType.Join,
            seq: msg.seq,
            succeeded: !reason,
            existingMessages: [/* TODO: sync */]
        });
    }

    function unsubscribe(ws: WebSocket, msg: ClientMessage) {
        let reason: string = "internal error";

        if (msg.type === MessageType.Leave && msg.channelName) {
            if (!nickFor(ws)) {
                reason = "not registered";
            } else {
                let subscribers = subscriptions.get(msg.channelName);
                if (subscribers) {
                    subscribers.delete(ws);
                    if (!subscribers.size) {
                        subscriptions.delete(msg.channelName);
                    }
                }
                reason = null;
            }
        }
    }

    // unregister: lazily done on first error
    function unregister(ws: WebSocket) {
        const nick = nicknames.get(ws);
        if (nick) {
            nicknames.delete(ws);
            registered.delete(nick);
        }
    }

    function nickFor(ws: WebSocket) {
        if (Connections.isAlive(ws)) {
            return nicknames.get(ws);
        }
        return null;
    }

    function handleChatMessage(ws: WebSocket, msg: ClientMessage) {
        let fail = "internal error";
        if (msg && msg.type === MessageType.SendChat) {
            const nick = nickFor(ws);
            const subscribers = subscriptions.get(msg.channelName);
            if (!nick) {
                fail = "not registered";
            } else if (!(subscribers && subscribers.has(ws))) {
                fail = "not in that channel";
            } else {
                const sentAt = new Date().getTime();
                subscribers.forEach(s => {
                    sendMessage(s, {
                        type: MessageType.SyncChat,
                        channelName: msg.channelName,
                        messages: [{
                            by: nick,
                            sentAt,
                            text: msg.text,
                        }]
                    });
                });
                fail = null;
            }
        }

        sendMessage(ws, {
            type: MessageType.SendChat,
            seq: msg.seq,
        });
    }
}

export function attachHandler(server: http.Server) {
    const wss = new WebSocket.Server({ server });
    wss.on("connection", (socket, request) => {
        Connections.onConnected(socket, request.url);
    });

    Connections.startPing();

    log.info(`added handler: plato (websocket only)`);
}
