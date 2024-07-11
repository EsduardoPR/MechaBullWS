import WebSocket from "ws";
export interface ConnectedUser {
    ws: WebSocket;
    username: string;
}