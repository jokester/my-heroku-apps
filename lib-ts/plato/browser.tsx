/**
 * UI of Prato
 */
import * as React from "react";
import { AppStateProps, bindState, bindAllState } from "./state";
import { ChatEntry } from "./messages";
import * as antd from "antd";

const { Steps, Icon, Input, Form, Button, Layout, Menu, message } = antd;
const { Header, Sider, Content } = Layout;

export const PlatoApp = bindAllState("PlatoApp", ({ appState }: AppStateProps) => {
    if (!appState.uiState.started) {
        return <BeforeStart />;
    }
    return <Started />;
});

const createChannel = "        createChannel";

const BeforeStart = bindAllState("BeforeStart", ({ appState }: AppStateProps) => {

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

const NickInput = bindAllState("NickInput", ({ appState }: AppStateProps) => {
    const { uiState } = appState;

    if (uiState.started || !uiState.wssConnected)
        return null;

    return <Input.Search
        placeholder="Nickname"
        prefix={<Icon type="user" />}
        value={appState.uiState.nick || ""}
        onChange={(ev) => appState.mutateState(s => s.nick = ev.target.value)}
        enterButton="Start"
        disabled={uiState.starting || uiState.started}
        onSearch={(ev) => appState.start(uiState.nick).catch(e => message.warn(e.toString()))}
    />;
});

const Started = bindAllState("Started", ({ appState }: AppStateProps) => {
    const { uiState } = appState;

    return <Layout style={{ height: "100vh" }}>
        <Sider width="200px">
            <div className="logo" />
            <Menu theme="dark" mode="inline" defaultSelectedKeys={[createChannel]} >
                {
                    Array.from(uiState.chatHistory.keys()).map(channelName =>
                        <Menu.Item key={channelName} selectedKeys={[]}>
                            <Icon type="team" />
                            <span>{channelName}</span>
                        </Menu.Item>)
                }
                < Menu.Item key={createChannel} >
                    <Icon type="plus" />
                    <NewChannelInput />
                </Menu.Item>
            </Menu>
        </Sider>
    </Layout >;
});


const NewChannelInput = bindAllState("NewChannelMenu", ({ appState }: AppStateProps) => {
    const { uiState } = appState;

    const submit = () => {
        if (uiState.chatHistory.has(uiState.channelNameDraft.trim())) {
            message.info("Already joined.");
            return;
        }
        appState.join((uiState.channelNameDraft || "").trim());
        appState.mutateState(s => s.channelNameDraft = null);
    };

    return <Input.Search
        placeholder="channel name"
        style={{ width: 200 }} enterButton="Join"
        value={uiState.channelNameDraft}
        onChange={ev => appState.mutateState(s => s.channelNameDraft = ev.target.value)}
        onPressEnter={submit}
        onSearch={submit}
    />;
});