/**
 * Definitions of websocket messages
 */
export const enum MessageType {
    /**
     * request-response messages
     */
    Register = "Register",
    Join = "Join",
    SendChat = "SendChat",
    Leave = "Leave",

    /**
     * unidirectional (only from server)
     */
    SyncChat = "SyncChat",

    /**
     * Ping
     */
    PingPong = "PingPong",
}

export interface ChatItem {
    channelName: string;
    by: string;
    sentAt: number;
}

// base type for discriminated union type
interface BaseMessage {
    type: MessageType;
    // a (supposedly unique) number to differentiate responses
    seq: number;
}

interface PingPong {
    type: MessageType.PingPong;
    seq?: undefined;
}

/**
 * Messages from client
 */
namespace _ClientMessage {
    export type All = Register | Join | SendChat | Leave | PingPong;

    interface Register extends BaseMessage {
        type: MessageType.Register;
        nickname: string;
    }

    interface Join extends BaseMessage {
        type: MessageType.Join;
        channelName: string;
    }

    interface Leave extends BaseMessage {
        type: MessageType.Leave;
        channelName: string;
    }

    interface SendChat extends BaseMessage {
        type: MessageType.SendChat;
        channelName: string;
        text: string;
    }
}

/**
 * Messages from server
 */
export namespace _ServerMessage {
    export type All = Register | Join | Leave | SendChat | SyncChat | PingPong;

    interface Register extends BaseMessage {
        type: MessageType.Register;
        succeeded: boolean;
        reason?: string;
    }

    interface Join extends BaseMessage {
        type: MessageType.Join;
        succeeded: boolean;
    }

    interface Leave extends BaseMessage {
        type: MessageType.Leave;
        succeeded: boolean;
    }

    interface SendChat extends BaseMessage {
        type: MessageType.SendChat;
    }

    interface SyncChat {
        seq?: undefined;
        type: MessageType.SyncChat;
        messages: ChatItem[];
    }
}

export type ClientMessage = _ClientMessage.All;
export type ServerMessage = _ServerMessage.All;
