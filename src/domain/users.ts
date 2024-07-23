import WebSocket from "ws";
export interface ConnectedUser {
    readyState: number;
    send(arg0: string): unknown;
    ws: WebSocket;
    username: string;
}