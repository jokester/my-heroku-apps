/**
 * State
 */
import { ClientMessage, ServerMessage, MessageType, ChatEntry } from "./messages";

let messageSeq = 0x8000;
const wssURL = `${location.origin.replace(/* http > ws, https > wss */ /^http/, "ws")}/plato`;

export interface ConnectionEventHandler {
    onConnectStatusChanged(establishing: boolean, connected: boolean): void;
    onNewMessage(channelName: string, messages: ChatEntry[]): void;
}

export class PlatoConnection {

    private readonly pendingReplyFulfill
        = new Map<number, { fulfill: Function, reject: Function }>();

    private readonly chatHistory
        = new Map<string, ChatEntry[]>();

    private socket: WebSocket;

    private connectionAlive = false;

    private startedConnection: Promise<void>;

    constructor(private readonly events: ConnectionEventHandler) { }

    startConnect() {
        if (!this.startedConnection) {
            this.startedConnection = new Promise<void>((fulfill, reject) => {
                this.events.onConnectStatusChanged(true, false);

                const socket = this.socket = new WebSocket(wssURL);
                socket.onopen = () => {
                    console.info("websocket connected");
                    this.connectionAlive = true;
                    this.sendMessage({
                        type: MessageType.PingPong,
                    });

                    this.events.onConnectStatusChanged(false,
                        this.connectionAlive = true);
                    fulfill();
                    // this.testServer();
                };

                socket.onclose = () => {
                    console.info("websocket disconnected");
                    this.events.onConnectStatusChanged(false,
                        this.connectionAlive = false);
                };

                socket.onerror = (ev) => {
                    console.info("websocket error", ev);
                    this.events.onConnectStatusChanged(false,
                        this.connectionAlive = false);
                };

                socket.onmessage = this.onSocketMessage;
            });
        }
        return this.startedConnection;
    }

    async register(nickname: string): Promise<void> {
        const req: ClientMessage = {
            type: MessageType.Register,
            nickname,
            seq: messageSeq++,
        };

        const res = await this.waitReply(req);
        if (res && res.type === MessageType.Register && res.succeeded) {
            return;
        }
        throw new Error(`error registering nickname`);
    }

    async joinChannel(channelName: string): Promise<void> {
        const req: ClientMessage = {
            type: MessageType.Join,
            seq: messageSeq++,
            channelName,
        };

        const res = await this.waitReply(req);
        if (res.type === MessageType.Join && res.succeeded) {
            this.events.onNewMessage(channelName, res.existingMessages || []);
            return;
        }
        throw new Error("error joining channel");
    }

    async leaveChannel(channelName: string): Promise<void> {
        const req: ClientMessage = {
            type: MessageType.Leave,
            seq: messageSeq++,
            channelName,
        };
        const res = await this.waitReply(req);
        if (res.type === MessageType.Leave && res.succeeded) {
            return;
        }
        throw new Error("error leaving channel");
    }

    async sendChat(channelName: string, text: string): Promise<void> {
        const req: ClientMessage = {
            type: MessageType.SendChat,
            seq: messageSeq++,
            channelName,
            text,
        };
        await this.waitReply(req);
    }

    private onSocketMessage = (ev: MessageEvent) => {

        try {
            const msg: ServerMessage = JSON.parse(ev.data);
            console.info("onSocketMessage", msg);

            const maybeHandler = this.pendingReplyFulfill.get(msg.seq);
            if (maybeHandler) {
                this.pendingReplyFulfill.delete(msg.seq);
                maybeHandler.fulfill(msg);
            } else {
                this.onNotHandledServerMessage(msg);
            }
        } catch (e) {
            console.error("error: onSocketMessage", e);
        }
    }

    private onNotHandledServerMessage(m: ServerMessage) {
        if (m.type === MessageType.SyncChat) {
            this.events.onNewMessage(m.channelName, m.messages);
        }
    }

    private sendMessage(msg: ClientMessage) {
        try {
            this.ensureConnectionIsAlive();
            this.socket.send(JSON.stringify(msg));
        } catch (e) {
            console.error("sendMessage", e);
        }
    }

    private ensureConnectionIsAlive() {
        if (!this.connectionAlive) {
            throw new Error("websocket disconnected.");
        }
    }

    private async waitReply(req: ClientMessage): Promise<ServerMessage> {
        if (!req.seq) {
            throw new Error("seq not defined");
        }
        this.ensureConnectionIsAlive();

        this.socket.send(JSON.stringify(req));

        const reply = new Promise<ServerMessage>((fulfill, reject) => {
            this.pendingReplyFulfill.set(req.seq,
                {
                    fulfill: (res: ServerMessage) => {
                        if (res && res.seq === req.seq && res.type === req.type) {
                            fulfill(res);
                        } else {
                            reject(
                                new Error(`waitReply: unexpected res: ${JSON.stringify(res)}`));
                        }
                    },
                    reject
                });
        });
        return reply;
    }

    private testServer() {
        setTimeout(async () => {
            await this.register("john cena");
            await this.joinChannel("chan1");
            await this.sendChat("chan1", "hi all");
        }, 5e3);
    }
}
