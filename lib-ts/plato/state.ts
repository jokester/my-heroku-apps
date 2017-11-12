/**
 * State manage with mobx
 */
import { observable, action, computed } from "mobx";
import { PlatoConnection } from "./connection";
import { observer, setComponent, } from "mobx-observer";
import { ChatEntry } from './messages';

interface StateModifier<T> {
    (state: T): void;
}

export interface AppStateProps {
    appState: AppState;
}

function mutate(f: Function) {
    (action(f))();
}

interface StateForUI {
    connecting: boolean;
    connected: boolean;

    nick: string;
    starting: boolean;

    activeChannel: string;
    messages: ChatEntry[];
}

export class AppState {

    @computed
    get isBusy() {
        return this.stateForUi.connecting || this.stateForUi.starting;
    }

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
        starting: false,
        nick: null,

        /**
         * during chat
         */
        activeChannel: null,
        messages: [],
    };

    private readonly conn = new PlatoConnection({
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

    @action
    mutateState(mutator: () => void) {
        mutator();
    }

    async start(nick: string) {
        await this.conn.startConnect();
        try {
            this.mutateState(() => {
                this.stateForUi.starting = true;
            });
            await this.conn.register(nick);
            this.mutateState(() => {
                this.stateForUi.nick = nick;
            });
        } finally {
            this.mutateState(() => {
                this.stateForUi.starting = false;
            });
        }
    }

    async join(channelName: string) {
        await this.conn.joinChannel(channelName);
        this.mutateState(() => {
            this.stateForUi.activeChannel = channelName;
        });
    }

    async send(channelName: string, text: string) {
        await this.conn.sendChat(channelName, text);
    }


}