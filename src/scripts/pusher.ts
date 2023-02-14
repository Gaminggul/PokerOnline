import Pusher, { type Channel } from "pusher-js";
import { env } from "../env.mjs";

const PUSHER_APP_KEY = env.NEXT_PUBLIC_PUSHER_APP_KEY;
const PUSHER_CLUSTER = env.NEXT_PUBLIC_PUSHER_CLUSTER;

let pusher: Pusher | null = null;
let subscriptions = 0;

export function getPusher(): Pusher {
    if (!pusher) {
        pusher = new Pusher(PUSHER_APP_KEY, {
            cluster: PUSHER_CLUSTER,
        });
    }
    return pusher;
}

export function subscribe(channelName: string): Channel {
    subscriptions++;
    const channel = getPusher().subscribe(channelName);
    return channel;
}

export function unsubscribe(channelName: string): void {
    subscriptions--;
    getPusher().unsubscribe(channelName);
    setTimeout(() => {
        if (pusher && subscriptions === 0) {
            pusher?.disconnect();
            pusher = null;
        }
    }, 0); // This is delayed to unsubscribe only destroys if no new subscriptions are made
}
