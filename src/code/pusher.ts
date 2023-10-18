import Pusher, { type Channel } from "pusher-js";
import { env } from "../env.mjs";
import { useEffect, useState } from "react";

const PUSHER_APP_KEY = env.NEXT_PUBLIC_PUSHER_APP_KEY;
const PUSHER_CLUSTER = env.NEXT_PUBLIC_PUSHER_CLUSTER;

let pusher: Pusher | null = null;
let subscriptions = 0;

function getPusher(): Pusher {
    if (!pusher) {
        console.log("Creating pusher");
        pusher = new Pusher(PUSHER_APP_KEY, {
            cluster: PUSHER_CLUSTER,
        });
    }
    return pusher;
}

export function subscribe(channelName: string): Channel {
    subscriptions++;
    const channel = getPusher().subscribe(channelName);
    channel.bind_global((eventName: string, data: unknown) => {
        console.log(`Pusher event: ${eventName}`, data);
    });
    return channel;
}

export function unsubscribe(channelName: string): void {
    subscriptions--;
    getPusher().unsubscribe(channelName);
    setTimeout(() => {
        if (pusher && subscriptions === 0) {
            console.log("Destroying pusher");
            pusher?.disconnect();
            pusher = null;
        }
    }, 0); // This is delayed so unsubscribe only destroys if no new subscriptions are made
}

export function useChannel<T extends string | undefined>(
    channelName: T,
): T extends string ? Channel : undefined {
    const [channel, setChannel] = useState<Channel | null>(null);

    useEffect(() => {
        if (channelName) {
            const channel = subscribe(channelName);
            setChannel(channel);
            return () => {
                unsubscribe(channelName);
            };
        }
    }, [channelName]);

    return (channel ?? undefined) as T extends string ? Channel : undefined;
}
