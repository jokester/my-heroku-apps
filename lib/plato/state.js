"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * State manage with mobx
 */
const mobx_1 = require("mobx");
const connection_1 = require("./connection");
const mobx_react_1 = require("mobx-react");
const browser_1 = require("../browser");
// a name that wont clash with real channel names
exports.$CreateChannel = "        createChannel";
const dummyChatHistory = [
    {
        sentAt: Date.now(),
        by: "sender",
        text: "tttext\nmultiline",
    }
];
class AppState {
    constructor() {
        this.uiState = {
            wssConnected: false,
            leftCollapsed: false,
            /**
             * right before start chat
             */
            started: false,
            starting: false,
            nick: null,
            lastJoinError: null,
            /**
             * during chat
             */
            currentChannelName: exports.$CreateChannel,
            channelNameDraft: "",
            chatHistory: new Map(),
            chatDraft: new Map(),
        };
        this.conn = new connection_1.PlatoConnection({
            onConnectStatusChanged: (establishing, connected) => {
                this.mutateState(s => {
                    s.wssConnected = connected;
                });
            },
            onNewMessage: (channelName, messages) => {
                console.log("onNewMessage", channelName, messages);
                this.mutateState(s => {
                    s.chatHistory.set(channelName, (s.chatHistory.get(channelName) || []).concat(messages));
                });
            },
        });
        setTimeout(() => this.conn.startConnect(), 1e3);
    }
    get currentChannelDraft() {
        return this.uiState.chatDraft.get(this.uiState.currentChannelName) || "";
    }
    get currentChannelHistory() {
        // if (1) return dummyChatHistory;
        return this.uiState.chatHistory.get(this.uiState.currentChannelName) || [];
    }
    get shouldDisableUI() {
        return !this.uiState.wssConnected;
    }
    mutateState(mutator) {
        mutator(this.uiState);
    }
    setChatDraft(channelName, text) {
        this.mutateState(s => s.chatDraft.set(channelName, text));
    }
    start(nick) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.uiState.started || this.uiState.starting || !nick) {
                // should not be here
                return;
            }
            this.mutateState(s => s.starting = true);
            try {
                yield this.conn.register(nick);
                // let user see the progress
                yield wait(1e3);
                this.mutateState(s => {
                    s.started = true;
                    s.nick = nick;
                    s.starting = false;
                });
            }
            finally {
                this.mutateState(s => {
                    s.starting = false;
                });
            }
        });
    }
    join(channelName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.conn.joinChannel(channelName);
            // highlight new channel
            if (this.uiState.currentChannelName === exports.$CreateChannel) {
                this.mutateState(s => s.currentChannelName = channelName);
            }
        });
    }
    send(channelName, text) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.conn.sendChat(channelName, text);
        });
    }
}
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], AppState.prototype, "currentChannelDraft", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], AppState.prototype, "currentChannelHistory", null);
tslib_1.__decorate([
    mobx_1.computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], AppState.prototype, "shouldDisableUI", null);
tslib_1.__decorate([
    mobx_1.observable,
    tslib_1.__metadata("design:type", Object)
], AppState.prototype, "uiState", void 0);
tslib_1.__decorate([
    mobx_1.action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Function]),
    tslib_1.__metadata("design:returntype", void 0)
], AppState.prototype, "mutateState", null);
exports.AppState = AppState;
function bindAllState(name, pureComponent) {
    return bindState(name, pureComponent);
}
exports.bindAllState = bindAllState;
function bindState(name, pureComponent) {
    return transformComponent(name, pureComponent);
}
exports.bindState = bindState;
/**
 * converts a pure react component
 * to a stateful component that only depends on mobx state
*/
function transformComponent(name, pureComponent) {
    if (browser_1.webpack_dev) {
        // dev build: assign name to new
        pureComponent.__debug_name = name;
    }
    return mobx_react_1.inject("appState")(mobx_react_1.observer(pureComponent));
}
const wait = (delay) => new Promise(fulfill => setTimeout(fulfill, delay));
