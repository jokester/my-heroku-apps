/**
 * State manage with mobx
 */
import { observable, action, computed } from "mobx";
import { PlatoConnection } from "./connection";
import { observer } from "mobx-observer";

interface StateModifier<T> {
    (state: T): void;
}

export interface AppStateProps {
    appState: AppState;
}

interface StateForUI {
    connecting: boolean;
    connected: boolean;
    nick: string;

    activeChannel: string;
    joinedChannels: string[];
    joiningChannels: string[];
}

export class AppState {
    @observable
    stateForUi: StateForUI = {
        /**
         * before connect
         */
        connecting: false,
        connected: false,

        /**
         * right before start chat
         */
        nick: null as string,

        /**
         * during chat
         */
        joiningChannels: [] as string[],
        joinedChannels: [] as string[],
        activeChannel: null as string,
    };

    private readonly conn = new PlatoConnection({
        onConnectStatusChanged: (establishing, connected) => {
            this.stateForUi.connecting = establishing;
            this.stateForUi.connected = connected;
        },
        onNewMessage: (channelName, messages) => {

        }
    });

    constructor() {

    }

    async start(nick: string) {
        await this.conn.startConnect();

    }




}