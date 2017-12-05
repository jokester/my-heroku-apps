/**
 * UI of Prato
 */
import * as React from "react";
import { AppStateProps, bindState, bindAllState, $CreateChannel } from "./state";
import { ChatEntry } from "./messages";
import * as antd from "antd";
import * as moment from "moment";

const { Steps, Icon, Input, Form, Button, Layout, Menu, List, message } = antd;
const { Header, Sider, Content } = Layout;

export const PlatoApp = bindAllState("PlatoApp", ({ appState }: AppStateProps) => {
    if (!appState.uiState.started) {
        return <BeforeStart />;
    }
    return <Started />;
});

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
        <Sider width="200px" >
            <div className="logo" />
            <Menu theme="dark" mode="inline"
                selectedKeys={[uiState.currentChannelName]}
                onClick={(param) => appState.mutateState(s => s.currentChannelName = param.key)} >
                {
                    Array.from(uiState.chatHistory.keys()).map(channelName =>
                        <Menu.Item key={channelName} >
                            <Icon type="team" />
                            <span>{channelName}</span>
                        </Menu.Item>)
                }
                <Menu.Item key={$CreateChannel} >
                    <Icon type="plus" />
                    <NewChannelInput />
                </Menu.Item>
            </Menu>
        </Sider>
        <Content style={{ display: "flex", flexDirection: "column", padding: 16 }} >
            <ChatHistory />
            <ChatDraft />
        </Content>
    </Layout >;
});

const ChatDraft = bindAllState("ChatDraft", ({ appState }: AppStateProps) => {
    const { uiState } = appState;
    const { currentChannelName, chatDraft } = uiState;

    if (!currentChannelName || uiState.currentChannelName === $CreateChannel)
        return null;

    const submit = async () => {
        const c = currentChannelName;
        await appState.send(currentChannelName, chatDraft.get(currentChannelName));
        appState.mutateState(s => s.chatDraft.set(c, ""));
    };

    console.log("ChatDraft", currentChannelName);

    const draft = appState.currentChannelDraft;
    return <div style={{ position: "relative" }}>
        <Input.TextArea rows={3} onPressEnter={ev => ev.target} autosize={false}
            value={chatDraft.get(currentChannelName)}
            onChange={ev => appState.setChatDraft(currentChannelName, ev.target.value)}
        />
        <Button type="primary" style={{ position: "absolute", right: 0, bottom: 0 }} onClick={submit}>Send</Button>
    </div>;
});

const ChatHistory = bindAllState("Started", ({ appState }: AppStateProps) => {
    const { uiState } = appState;

    if (!uiState.currentChannelName || uiState.currentChannelName === $CreateChannel)
        return null;

    const history = appState.currentChannelHistory;

    return <div style={{ overflowY: "scroll", flexGrow: 1 }} >
        {
            history.map((h, i) =>
                <div className="chat-history-item">
                    <span className="chat-history-author">{h.by}</span>
                    <span className="chat-history-date">{moment(h.sentAt).fromNow()}</span>
                    <hr />
                    <pre className="chat-history-text">{h.text}</pre>
                </div>)
        }
    </div>;
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