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
    const interval = setInterval(() => {
        websocket.ping();
    },10000);
    websocket.on("message",async (data) => {
        const obj = JSON.parse(data.toString()).body;
        const obj_json = JSON.stringify(obj);
        await superagent
            .post(`localhost:3000/api/${path}`)
            .set("Content-Type","application/json")
            .send(obj_json);
    });
    websocket.on("error",(/** @type {any} */ err) => {
        clearInterval(interval);
        throw err;
    });
    websocket.on("close",() => {
        console.log("Connection closed, reconnecting...");
        clearInterval(interval);
        websocket.removeAllListeners();
        setTimeout(connect,1000);
    });
}

console.log("Connecting to proxy...");
connect();
