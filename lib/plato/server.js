"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const log_1 = require("../server/log");
const log = log_1.getLogger();
var Connections;
(function (Connections) {
    // used to assign a unique id to connections
    let connectionCount = 0;
    const activeConnection = new Map();
    function onConnected(socket, path) {
        if (path === "/plato") {
            acceptConnection(socket);
        }
        else {
            log.warn(`unrecognized websocket connection: ${path}`);
            socket.close();
        }
    }
    Connections.onConnected = onConnected;
    function acceptConnection(ws) {
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
    function handleWsMessage(ws, data) {
        try {
            const msg = JSON.parse(data.toString());
            log.verbose("got message", data);
            Chat.handleClientMessage(ws, msg);
        }
        catch (e) {
            log.warn(`error handling message`, e);
        }
    }
    function freeConnection(ws, alreadyClosed) {
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
        }
        catch (e) {
            log.warn("error finalizing websocket", e);
        }
    }
    function isAlive(ws) {
        return activeConnection.has(ws);
    }
    Connections.isAlive = isAlive;
    function sendMessage(ws, message) {
        try {
            ws.send(JSON.stringify(message));
            log.verbose(`sendMessage`, message);
        }
        catch (e) {
            log.warn(`sendMessage`, e);
            freeConnection(ws, false);
        }
    }
    Connections.sendMessage = sendMessage;
    function logConnectionStats() {
        log.info(`${activeConnection.size} active connections`);
    }
    function ping() {
        const toDelete = [];
        for (const c of activeConnection.keys()) {
            try {
                sendMessage(c, { type: "PingPong" /* PingPong */ });
            }
            catch (e) {
                toDelete.push(c);
            }
        }
        for (const c of toDelete) {
            freeConnection(c, false);
        }
    }
    let pingTimer = undefined;
    function startPing() {
        if (pingTimer === undefined) {
            pingTimer = setInterval(ping, 10e3);
        }
    }
    Connections.startPing = startPing;
})(Connections || (Connections = {}));
var Chat;
(function (Chat) {
    // 1-1 mapping of nickname -- socket
    const registered = new Map();
    const nicknames = new Map();
    // 1-n mapping of socket - channel
    const subscriptions = new Map();
    function handleClientMessage(ws, msg) {
        if (msg.type === "Register" /* Register */) {
            register(ws, msg);
        }
        else if (msg.type === "Join" /* Join */) {
            subscribe(ws, msg);
        }
        else if (msg.type === "Leave" /* Leave */) {
            unsubscribe(ws, msg);
        }
        else if (msg.type === "SendChat" /* SendChat */) {
            handleChatMessage(ws, msg);
        }
        else if (msg.type === "PingPong" /* PingPong */) {
        }
        else {
            log.warn(`cannot recognized message`, msg);
        }
    }
    Chat.handleClientMessage = handleClientMessage;
    function sendMessage(ws, msg) {
        try {
            Connections.sendMessage(ws, msg);
        }
        catch (e) {
            unregister(ws);
        }
    }
    function register(ws, msg) {
        let reason = "internal error";
        if (msg.type === "Register" /* Register */ && msg.nickname) {
            if (nickFor(ws)) {
                reason = "already registered";
            }
            else if (registered.has(msg.nickname)
                && Connections.isAlive(registered.get(msg.nickname))) {
                reason = "nickname occupied";
            }
            else {
                registered.set(msg.nickname, ws);
                nicknames.set(ws, msg.nickname);
                reason = null;
            }
        }
        sendMessage(ws, {
            type: "Register" /* Register */,
            seq: msg.seq,
            succeeded: !reason,
            reason: reason || undefined,
        });
    }
    function subscribe(ws, msg) {
        let reason = "internal error";
        if (msg.type === "Join" /* Join */ && msg.channelName) {
            if (!nickFor(ws)) {
                reason = "not registered";
            }
            else {
                let subscribers = subscriptions.get(msg.channelName);
                if (!subscribers) {
                    subscriptions.set(msg.channelName, subscribers = new Set());
                }
                subscribers.add(ws);
                reason = null;
            }
        }
        sendMessage(ws, {
            type: "Join" /* Join */,
            seq: msg.seq,
            succeeded: !reason,
            existingMessages: []
        });
    }
    function unsubscribe(ws, msg) {
        let reason = "internal error";
        if (msg.type === "Leave" /* Leave */ && msg.channelName) {
            if (!nickFor(ws)) {
                reason = "not registered";
            }
            else {
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
    function unregister(ws) {
        const nick = nicknames.get(ws);
        if (nick) {
            nicknames.delete(ws);
            registered.delete(nick);
        }
    }
    function nickFor(ws) {
        if (Connections.isAlive(ws)) {
            return nicknames.get(ws);
        }
        return null;
    }
    function handleChatMessage(ws, msg) {
        let fail = "internal error";
        if (msg && msg.type === "SendChat" /* SendChat */) {
            const nick = nickFor(ws);
            const subscribers = subscriptions.get(msg.channelName);
            if (!nick) {
                fail = "not registered";
            }
            else if (!(subscribers && subscribers.has(ws))) {
                fail = "not in that channel";
            }
            else {
                const sentAt = new Date().getTime();
                for (const s of subscribers) {
                    sendMessage(s, {
                        type: "SyncChat" /* SyncChat */,
                        channelName: msg.channelName,
                        messages: [{
                                by: nick,
                                sentAt,
                                text: msg.text,
                            }]
                    });
                }
                fail = null;
            }
        }
        sendMessage(ws, {
            type: "SendChat" /* SendChat */,
            seq: msg.seq,
        });
    }
})(Chat || (Chat = {}));
function attachHandler(server) {
    const wss = new WebSocket.Server({ server });
    wss.on("connection", (socket, request) => {
        Connections.onConnected(socket, request.url);
    });
    Connections.startPing();
    log.info(`added handler: plato (websocket only)`);
}
exports.attachHandler = attachHandler;
