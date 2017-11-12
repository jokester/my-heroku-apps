/**
 * UI of Prato
 */

import { React } from "../browser";
import { observer, makeObserver, setComponent } from "mobx-observer";

import { AppStateProps } from "./state";
import { ChatEntry } from './messages';

setComponent(React.Component as any);

@observer
export class PlatoApp extends React.Component<AppStateProps, { currentChannel: string; }> {
    render() {

        const { appState } = this.props;
        const { stateForUi } = appState;

        if (!stateForUi.nick) {
            return <Login appState={appState} />;
        } else if (!stateForUi.activeChannel) {
            return <JoinChannel appState={appState} />;
        } else {
            return <InChannel appState={appState} />;
        }
    }
}

@observer
class Login extends React.Component<AppStateProps, { nickDraft: string; error: string; }> {

    state = {
        nickDraft: "",
        error: null as string,
    };

    handleChange = (ev: Event) => {
        this.setState({ nickDraft: (ev.target as HTMLInputElement).value });
    }

    handleJoin = async (ev: Event) => {
        ev.preventDefault();
        const { appState }: AppStateProps = this.props;

        try {
            await appState.start(this.state.nickDraft);
        } catch (e) {
            this.setState({ error: e.toString() });
        }
    }

    render() {
        const { appState }: AppStateProps = this.props;
        const { appState: { stateForUi } }: AppStateProps = this.props;
        return <form className="pure-form">
            <legend>Login</legend>
            <input type="text" onChange={this.handleChange} value={this.state.nickDraft} placeholder="pick a nickname" />
            <button className="pure-button"
                onClick={this.handleJoin} disabled={appState.isBusy || !this.state.nickDraft}>Start</button>
            <span>{this.state.error}</span>
        </form>;
    }
}

@observer
class JoinChannel extends React.Component<AppStateProps, { nickDraft: string; error: string; }> {

    state = {
        nickDraft: "",
        error: null as string,
    };

    handleChange = (ev: Event) => {
        this.setState({ nickDraft: (ev.target as HTMLInputElement).value });
    }

    handleJoin = async (ev: Event) => {
        ev.preventDefault();
        const { appState }: AppStateProps = this.props;

        try {
            await appState.join(this.state.nickDraft);

        } catch (e) {
            this.setState({ error: e.toString() });
        }
    }

    render() {
        const { appState }: AppStateProps = this.props;
        const { appState: { stateForUi } }: AppStateProps = this.props;
        return <form className="pure-form">
            <legend>Join a Channel</legend>
            <input type="text" onChange={this.handleChange} value={this.state.nickDraft} placeholder="pick a channel" />
            <button className="pure-button"
                onClick={this.handleJoin} disabled={appState.isBusy || !this.state.nickDraft}>Create or Join</button>
        </form>;
    }
}

@observer
class InChannel extends React.Component<AppStateProps, { draft: string; error: string; }> {

    state = {
        draft: "",
        error: null as string,
    };

    handleChange = (ev: Event) => {
        this.setState({ draft: (ev.target as HTMLInputElement).value });
    }

    handleSend = async (ev: Event) => {
        ev.preventDefault();
        const { appState }: AppStateProps = this.props;

        try {
            await appState.send(appState.stateForUi.activeChannel, this.state.draft);
            this.setState({ draft: "" });
        } catch (e) {
            this.setState({ error: e.toString() });
        }
    }

    entryFor(m: ChatEntry, index: number) {
        return <div key={String(index)}>
            <p>{new Date(m.sentAt).toString()}</p>
            <p>from '{m.by}': </p>
            <pre>{m.text}</pre>
        </div>;
    }

    render() {
        const { appState }: AppStateProps = this.props;
        const { appState: { stateForUi } }: AppStateProps = this.props;
        return <form className="pure-form">
            <legend>Channel: {stateForUi.activeChannel}</legend>
            <input type="text" onChange={this.handleChange} value={this.state.draft} placeholder="write something" />
            <button className="pure-button"
                onClick={this.handleSend} >Send</button>
            <hr />
            {stateForUi.messages.map(this.entryFor)}
        </form>;
    }
}

