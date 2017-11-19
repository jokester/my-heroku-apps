/**
 * State manage with mobx
 */
import { observable, action, computed, } from "mobx";
import { PlatoConnection } from "./connection";
import { ChatEntry } from "./messages";
import * as React from "react";
import { observer, inject, Provider, IReactComponent } from "mobx-react";
import { webpack_dev } from "../browser";

interface StateMutator<T> {
    (state: T): void;
}

export interface AppStateProps {
    appState: AppState;
}

interface UiState {
    /** automatically reconnects under the hood */
    wssConnected: boolean;

    /** nick is trht */
    started: boolean;
    starting: boolean;
    nick: string;
    lastJoinError: string;

    currentChannelName: string;
    chatHistory: Map<string, ChatEntry[]>;
    chatDraft: Map<string, string>;
}

export class AppState {

    @computed
    get shouldDisableUI() {
        return !this.uiState.wssConnected;
    }

    @observable
    uiState: UiState = {
        wssConnected: false,

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
        currentChannelName: null,
        chatHistory: new Map(),
        chatDraft: new Map(),
    };

    private readonly conn = new PlatoConnection({
        onConnectStatusChanged: (establishing, connected) => {
            this.mutateState(s => {
                s.wssConnected = connected;
            });
        },
        onNewMessage: (channelName, messages) => {
            this.mutateState(s => {
                s.chatHistory.set(channelName,
                    (s.chatHistory.get(channelName) || []).concat(messages));
            });
        },
    });

    constructor() {
        setTimeout(() =>
            this.conn.startConnect(), 5e3);
    }

    @action
    mutateState(mutator: StateMutator<UiState>) {
        mutator(this.uiState);
    }

    async start(nick: string) {
        if (this.uiState.started || this.uiState.starting || !nick) {
            // should not be here
            return;
        }

        this.mutateState(s => s.starting = true);

        try {
            await this.conn.register(nick);

            await wait(5e3);
            this.mutateState(s => {
                s.started = true;
                s.nick = nick;
                s.starting = false;
            });
        } finally {
            this.mutateState(s => {
                s.starting = false;
            });
        }
    }

    async join(channelName: string) {
        this.conn.joinChannel(channelName);
    }

    async send(channelName: string, text: string) {
        await this.conn.sendChat(channelName, text);
    }
}

export function bindState(name: string, pureComponent: IReactComponent<AppStateProps>) {
    return transformComponent<"appState", AppState, AppStateProps>(name, pureComponent);
}

/**
 * converts a pure react component
 * to a stateful component that only depends on mobx state
*/
function transformComponent<PropKey extends string, Store, Prop extends PropKVPair<PropKey, Store>>(
    name: string, pureComponent: IReactComponent<Prop>) {


    if (webpack_dev) {
        // dev build: assign name to new
        (pureComponent as any).__debug_name = name;
    }

    return inject("appState")(observer(pureComponent)) as IReactComponent<{}>;
}

type PropKVPair<PropKey extends string, Store> = {
    [k in PropKey]: Store;
};

const wait = (delay: number) => new Promise<void>(fulfill => setTimeout(fulfill, delay));