"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
let messageSeq = 0x8000;
const wssURL = `${location.origin.replace(/* http > ws, https > wss */ /^http/, "ws")}/plato`;
class PlatoConnection {
    constructor(events) {
        this.events = events;
        this.pendingReplyFulfill = new Map();
        this.chatHistory = new Map();
        this.connectionAlive = false;
        this.onSocketMessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data);
                console.info("onSocketMessage", msg);
                const maybeHandler = this.pendingReplyFulfill.get(msg.seq);
                if (maybeHandler) {
                    this.pendingReplyFulfill.delete(msg.seq);
                    maybeHandler.fulfill(msg);
                }
                else {
                    this.onNotHandledServerMessage(msg);
                }
            }
            catch (e) {
                console.error("error: onSocketMessage", e);
            }
        };
    }
    startConnect() {
        if (!this.startedConnection) {
            this.startedConnection = new Promise((fulfill, reject) => {
                this.events.onConnectStatusChanged(true, false);
                const socket = this.socket = new WebSocket(wssURL);
                socket.onopen = () => {
                    console.info("websocket connected");
                    this.connectionAlive = true;
                    this.sendMessage({
                        type: "PingPong" /* PingPong */,
                    });
                    this.events.onConnectStatusChanged(false, this.connectionAlive = true);
                    fulfill();
                    // this.testServer();
                };
                socket.onclose = () => {
                    console.info("websocket disconnected");
                    this.events.onConnectStatusChanged(false, this.connectionAlive = false);
                };
                socket.onerror = (ev) => {
                    console.info("websocket error", ev);
                    this.events.onConnectStatusChanged(false, this.connectionAlive = false);
                };
                socket.onmessage = this.onSocketMessage;
            });
        }
        return this.startedConnection;
    }
    register(nickname) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const req = {
                type: "Register" /* Register */,
                nickname,
                seq: messageSeq++,
            };
            const res = yield this.waitReply(req);
            if (res && res.type === "Register" /* Register */ && res.succeeded) {
                return;
            }
            throw new Error(`error registering nickname`);
        });
    }
    joinChannel(channelName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const req = {
                type: "Join" /* Join */,
                seq: messageSeq++,
                channelName,
            };
            const res = yield this.waitReply(req);
            if (res.type === "Join" /* Join */ && res.succeeded) {
                this.events.onNewMessage(channelName, res.existingMessages || []);
                return;
            }
            throw new Error("error joining channel");
        });
    }
    leaveChannel(channelName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const req = {
                type: "Leave" /* Leave */,
                seq: messageSeq++,
                channelName,
            };
            const res = yield this.waitReply(req);
            if (res.type === "Leave" /* Leave */ && res.succeeded) {
                return;
            }
            throw new Error("error leaving channel");
        });
    }
    sendChat(channelName, text) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const req = {
                type: "SendChat" /* SendChat */,
                seq: messageSeq++,
                channelName,
                text,
            };
            yield this.waitReply(req);
        });
    }
    onNotHandledServerMessage(m) {
        if (m.type === "SyncChat" /* SyncChat */) {
            this.events.onNewMessage(m.channelName, m.messages);
        }
    }
    sendMessage(msg) {
        try {
            this.ensureConnectionIsAlive();
            this.socket.send(JSON.stringify(msg));
        }
        catch (e) {
            console.error("sendMessage", e);
        }
    }
    ensureConnectionIsAlive() {
        if (!this.connectionAlive) {
            throw new Error("websocket disconnected.");
        }
    }
    waitReply(req) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!req.seq) {
                throw new Error("seq not defined");
            }
            this.ensureConnectionIsAlive();
            this.socket.send(JSON.stringify(req));
            const reply = new Promise((fulfill, reject) => {
                this.pendingReplyFulfill.set(req.seq, {
                    fulfill: (res) => {
                        if (res && res.seq === req.seq && res.type === req.type) {
                            fulfill(res);
                        }
                        else {
                            reject(new Error(`waitReply: unexpected res: ${JSON.stringify(res)}`));
                        }
                    },
                    reject
                });
            });
            return reply;
        });
    }
    testServer() {
        setTimeout(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.register("john cena");
            yield this.joinChannel("chan1");
            yield this.sendChat("chan1", "hi all");
        }), 5e3);
    }
}
exports.PlatoConnection = PlatoConnection;
