import { panic } from "functional-utilities";
import WebSocket from "ws";
import superagent from "superagent";

const path = "pusher_poker_existence";

const url = process.env.PROXY_URL ?? panic("No proxy url found");
const secret = process.env.PROXY_SECRET ?? panic("No proxy secret found");

function connect() {
    const websocket = new WebSocket(
        `${url}?secret=${secret}&value=${path}&filter=contains`
    );
    websocket.on("message", async (/** @type {string} */ data) => {
        await superagent.post(`localhost:3000/api/${path}`).send(data);
    });
    websocket.on("error", (/** @type {any} */ err) => {
        throw err;
    });
    websocket.on("close", () => {
        console.log("Connection closed, reconnecting...");
        websocket.removeAllListeners();
        setTimeout(connect, 1000);
    });
}

connect();
