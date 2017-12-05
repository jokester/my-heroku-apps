"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/**
 * UI of Prato
 */
const React = require("react");
const state_1 = require("./state");
const antd = require("antd");
const moment = require("moment");
const { Steps, Icon, Input, Form, Button, Layout, Menu, List, message } = antd;
const { Header, Sider, Content } = Layout;
exports.PlatoApp = state_1.bindAllState("PlatoApp", ({ appState }) => {
    if (!appState.uiState.started) {
        return React.createElement(BeforeStart, null);
    }
    return React.createElement(Started, null);
});
const BeforeStart = state_1.bindAllState("BeforeStart", ({ appState }) => {
    const { uiState } = appState;
    const waitingConnection = !uiState.wssConnected;
    const canInputName = !uiState.starting && uiState.wssConnected;
    const nickStatus = !uiState.wssConnected ? "wait" : uiState.starting ? "finish" : "process";
    const startStatus = uiState.starting ? "process" : "wait";
    const steps = [
        React.createElement(Steps.Step, { key: "connect", title: "Connect", icon: React.createElement(Icon, { type: waitingConnection ? "loading" : "check" }), status: waitingConnection ? "wait" : "finish" }),
        React.createElement(Steps.Step, { key: "input-name", title: "Pick a nick", icon: React.createElement(Icon, { type: "user" }), status: nickStatus }),
        React.createElement(Steps.Step, { key: "start", title: "Chattt!", icon: React.createElement(Icon, { type: "team" }), status: startStatus }),
    ];
    const nickInput = canInputName && React.createElement(Input.Search, { placeholder: "nickname", size: "large", enterButton: true });
    return React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center" } },
        React.createElement("div", { className: "before-start" },
            React.createElement(Steps, null, steps),
            React.createElement(NickInput, null)));
});
const NickInput = state_1.bindAllState("NickInput", ({ appState }) => {
    const { uiState } = appState;
    if (uiState.started || !uiState.wssConnected)
        return null;
    return React.createElement(Input.Search, { placeholder: "Nickname", prefix: React.createElement(Icon, { type: "user" }), value: appState.uiState.nick || "", onChange: (ev) => appState.mutateState(s => s.nick = ev.target.value), enterButton: "Start", disabled: uiState.starting || uiState.started, onSearch: (ev) => appState.start(uiState.nick).catch(e => message.warn(e.toString())) });
});
const Started = state_1.bindAllState("Started", ({ appState }) => {
    const { uiState } = appState;
    return React.createElement(Layout, { style: { height: "100vh", width: "100vw" } },
        React.createElement(Sider, { width: "200px" },
            React.createElement("div", { className: "logo" }),
            React.createElement(Menu, { theme: "dark", mode: "inline", selectedKeys: [uiState.currentChannelName], onClick: (param) => appState.mutateState(s => s.currentChannelName = param.key) },
                Array.from(uiState.chatHistory.keys()).map(channelName => React.createElement(Menu.Item, { key: channelName },
                    React.createElement(Icon, { type: "team" }),
                    React.createElement("span", null, channelName))),
                React.createElement(Menu.Item, { key: state_1.$CreateChannel },
                    React.createElement(Icon, { type: "plus" }),
                    React.createElement(NewChannelInput, null)))),
        React.createElement(Content, { style: { display: "flex", flexDirection: "column", padding: 16 } },
            React.createElement(ChatHistory, null),
            React.createElement(ChatDraft, null)));
});
const ChatDraft = state_1.bindAllState("ChatDraft", ({ appState }) => {
    const { uiState } = appState;
    const { currentChannelName, chatDraft } = uiState;
    if (!currentChannelName || uiState.currentChannelName === state_1.$CreateChannel)
        return null;
    const submit = () => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const c = currentChannelName;
        yield appState.send(currentChannelName, chatDraft.get(currentChannelName));
        appState.mutateState(s => s.chatDraft.set(c, ""));
    });
    console.log("ChatDraft", currentChannelName);
    const draft = appState.currentChannelDraft;
    return React.createElement("div", { style: { position: "relative" } },
        React.createElement(Input.TextArea, { rows: 3, onPressEnter: ev => ev.target, autosize: false, value: chatDraft.get(currentChannelName), onChange: ev => appState.setChatDraft(currentChannelName, ev.target.value) }),
        React.createElement(Button, { type: "primary", style: { position: "absolute", right: 0, bottom: 0 }, onClick: submit }, "Send"));
});
const ChatHistory = state_1.bindAllState("Started", ({ appState }) => {
    const { uiState } = appState;
    if (!uiState.currentChannelName || uiState.currentChannelName === state_1.$CreateChannel)
        return null;
    const history = appState.currentChannelHistory;
    return React.createElement("div", { style: { overflowY: "scroll", flexGrow: 1 } }, history.map((h, i) => React.createElement("div", { className: "chat-history-item" },
        React.createElement("span", { className: "chat-history-author" }, h.by),
        React.createElement("span", { className: "chat-history-date" }, moment(h.sentAt).fromNow()),
        React.createElement("hr", null),
        React.createElement("pre", { className: "chat-history-text" }, h.text))));
});
const NewChannelInput = state_1.bindAllState("NewChannelMenu", ({ appState }) => {
    const { uiState } = appState;
    const submit = () => {
        if (uiState.chatHistory.has(uiState.channelNameDraft.trim())) {
            message.info("Already joined.");
            return;
        }
        appState.join((uiState.channelNameDraft || "").trim());
        appState.mutateState(s => s.channelNameDraft = null);
    };
    return React.createElement(Input.Search, { placeholder: "channel name", style: { width: 200 }, enterButton: "Join", value: uiState.channelNameDraft, onChange: ev => appState.mutateState(s => s.channelNameDraft = ev.target.value), onPressEnter: submit, onSearch: submit });
});
