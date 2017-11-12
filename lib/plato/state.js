"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * State manage with mobx
 */
const mobx_1 = require("mobx");
const connection_1 = require("./connection");
function mutate(f) {
    (mobx_1.action(f))();
}
class AppState {
    constructor() {
        this.stateForUi = {
            /**
             * before connect
             */
            connecting: false,
            connected: false,
            /**
             * right before start chat
             */
            starting: false,
            nick: null,
            /**
             * during chat
             */
            activeChannel: null,
            messages: [],
        };
        this.conn = new connection_1.PlatoConnection({
            onConnectStatusChanged: (establishing, connected) => {
                this.mutateState(() => {
                    this.stateForUi.connecting = establishing;
                    this.stateForUi.connected = connected;
                });
            },
            onNewMessage: (channelName, messages) => {
                this.mutateState(() => {
                    this.stateForUi.messages.push(...messages);
                });
            }
        });
    }
    get isBusy() {
        return this.stateForUi.connecting || this.stateForUi.starting;
    }
    mutateState(mutator) {
        mutator();
    }
    start(nick) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.conn.startConnect();
            try {
                this.mutateState(() => {
                    this.stateForUi.starting = true;
                });
                yield this.conn.register(nick);
                this.mutateState(() => {
                    this.stateForUi.nick = nick;
                });
            }
            finally {
                this.mutateState(() => {
                    this.stateForUi.starting = false;
                });
            }
        });
    }
    join(channelName) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            yield this.conn.joinChannel(channelName);
            this.mutateState(() => {
                this.stateForUi.activeChannel = channelName;
            });
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
], AppState.prototype, "isBusy", null);
tslib_1.__decorate([
    mobx_1.observable,
    tslib_1.__metadata("design:type", Object)
], AppState.prototype, "stateForUi", void 0);
tslib_1.__decorate([
    mobx_1.action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Function]),
    tslib_1.__metadata("design:returntype", void 0)
], AppState.prototype, "mutateState", null);
exports.AppState = AppState;
