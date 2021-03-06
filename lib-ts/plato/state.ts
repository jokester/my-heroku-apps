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

// a name that wont clash with real channel names
export const $CreateChannel = "        createChannel";

interface UiState {
    /** automatically reconnects under the hood */
    wssConnected: boolean;

    leftCollapsed: boolean;

    /** nick is trht */
    started: boolean;
    starting: boolean;
    nick: string;
    lastJoinError: string;

    currentChannelName: string;
    channelNameDraft: string;
    chatHistory: Map<string, ChatEntry[]>;
    chatDraft: Map<string, string>;
}

const dummyChatHistory: ChatEntry[] = [
    {
        sentAt: Date.now(),
        by: "sender",
        text: "tttext\nmultiline",
    }
];

export class AppState {

    @computed
    get currentChannelDraft() {
        return this.uiState.chatDraft.get(this.uiState.currentChannelName) || "";
    }

    @computed
    get currentChannelHistory() {
        // if (1) return dummyChatHistory;
        return this.uiState.chatHistory.get(this.uiState.currentChannelName) || [];
    }

    @computed
    get shouldDisableUI() {
        return !this.uiState.wssConnected;
    }

    @observable
    uiState: UiState = {
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
        currentChannelName: $CreateChannel,
        channelNameDraft: "",
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
            console.log("onNewMessage", channelName, messages);
            this.mutateState(s => {
                s.chatHistory.set(channelName,
                    (s.chatHistory.get(channelName) || []).concat(messages));
            });
        },
    });

    constructor() {
        setTimeout(() =>
            this.conn.startConnect(), 1e3);
    }

    @action
    mutateState(mutator: StateMutator<UiState>) {
        mutator(this.uiState);
    }

    setChatDraft(channelName: string, text: string) {
        this.mutateState(s => s.chatDraft.set(channelName, text));
    }

    async start(nick: string) {
        if (this.uiState.started || this.uiState.starting || !nick) {
            // should not be here
            return;
        }

        this.mutateState(s => s.starting = true);

        try {
            await this.conn.register(nick);

            // let user see the progress
            await wait(1e3);

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
        await this.conn.joinChannel(channelName);

        // highlight new channel
        if (this.uiState.currentChannelName === $CreateChannel) {
            this.mutateState(s => s.currentChannelName = channelName);
        }
    }

    async send(channelName: string, text: string) {
        await this.conn.sendChat(channelName, text);
    }
}

export function bindAllState(name: string, pureComponent: IReactComponent<AppStateProps>) {
    return bindState<{}>(name, pureComponent);
}

export function bindState<DirectProps = {}>(name: string, pureComponent: IReactComponent<AppStateProps & DirectProps>) {
    return transformComponent<"appState", AppState, AppStateProps>(name, pureComponent) as IReactComponent<DirectProps>;
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