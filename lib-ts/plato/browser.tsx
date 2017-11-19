/**
 * UI of Prato
 */
import * as React from "react";
import { AppStateProps, bindState } from "./state";
import { ChatEntry } from "./messages";
import * as antd from "antd";

const { Steps, Icon, Input, Form, Button, message } = antd;

export const PlatoApp = bindState("PlatoApp", ({ appState }: AppStateProps) => {
    if (!appState.uiState.started) {
        return <BeforeStart />;
    }
    return <p>hi</p>;
});

const BeforeStart = bindState("beforeStart", ({ appState }: AppStateProps) => {

    const { uiState } = appState;

    const waitingConnection = !uiState.wssConnected;
    const canInputName = !uiState.starting && uiState.wssConnected;

    const nickStatus = !uiState.wssConnected ? "wait" : uiState.starting ? "finish" : "process";
    const startStatus = uiState.starting ? "process" : "wait";

    const steps = [
        <Steps.Step key="connect" title="Connect"
            icon={<Icon type={waitingConnection ? "loading" : "check"} />}
            status={waitingConnection ? "wait" : "finish"} />,
        <Steps.Step key="input-name" title="Pick a nick"
            icon={<Icon type="user" />}
            status={nickStatus}
        />,
        <Steps.Step key="start" title="Chattt!" icon={<Icon type="team" />}
            status={startStatus} />,
    ];

    const nickInput = canInputName && <Input.Search placeholder="nickname" size="large" enterButton />;
    return <div className="v-center">
        <Steps >{steps}</Steps>
        <NickInput />
    </div>;
});

const NickInput = bindState("NickInput", ({ appState }: AppStateProps) => {
    const { uiState } = appState;

    if (uiState.started || !uiState.wssConnected)
        return null;

    return <Input.Search
        placeholder="Enter your nickname"
        prefix={<Icon type="user" />}
        value={appState.uiState.nick || ""}
        onChange={(ev) => appState.mutateState(s => s.nick = ev.target.value)}
        enterButton="Start"
        disabled={uiState.starting || uiState.started}
        onSearch={(ev) => appState.start(uiState.nick).catch(e => message.warn(e.toString()))}
    />;
});
