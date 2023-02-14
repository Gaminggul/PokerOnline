import Pusher from "pusher";
import { env } from "../env.mjs";

export function create_pusher_server() {
    const pusher_server = new Pusher({
        appId: env.NEXT_PUBLIC_PUSHER_APP_ID,
        key: env.NEXT_PUBLIC_PUSHER_APP_KEY,
        secret: env.PUSHER_SECRET,
        cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    return pusher_server;
}
