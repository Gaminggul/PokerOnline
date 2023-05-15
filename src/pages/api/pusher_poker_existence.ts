import dayjs from "dayjs";
import type { NextApiHandler } from "next";
import { prisma } from "../../server/db";
import superagent from "superagent";
import { z } from "zod";
import type { TimerObjectSchema } from "../../code/timer_obj";
import { v4 } from "uuid";
import { panic } from "functional-utilities";

const pusher_existence_schema = z.object({
    time_ms: z.number(),
    events: z.array(
        z.object({
            channel: z.string(),
            name: z.union([
                z.literal("channel_vacated"),
                z.literal("channel_occupied"),
            ]),
        })
    ),
});

type PusherExistence = z.infer<typeof pusher_existence_schema>;

async function handle_event(event: PusherExistence["events"][number]) {
    if (event.name === "channel_occupied") {
        return;
    }
    const timeout_time = dayjs().add(5, "second").toDate();

    console.log("Setting timeout for channel", event.channel);
    if (event.channel.startsWith("lobby")) {
        console.log("Deleting lobby");
        await prisma.lobby.delete({
            where: {
                channel: event.channel,
            },
        }); // deleting a lobby cascades to deleting the players and game
        return;
    }
    if (!event.channel.startsWith("player")) {
        panic("Invalid channel name");
    }
    const user = await prisma.user.update({
        where: {
            channel: event.channel,
        },
        data: {
            timeout: timeout_time,
        },
        select: {
            id: true,
            player: true,
        },
    });
    if (!user.player) {
        console.log("Player already deleted");
        return;
    }
    const data: z.infer<typeof TimerObjectSchema> = {
        user_id: user.id,
        purpose: "disconnect",
        date: timeout_time,
        id: v4(),
    };
    const request_url = `https://hooket.moeglich.dev/hooket/set_timer?at=${timeout_time.toISOString()}&webhook=${encodeURIComponent(
        "https://proxy.moeglich.dev/poker_timer"
    )}`;
    console.log(request_url);
    await superagent
        .post(request_url)
        .set("Content-Type", "application/json")
        .send(JSON.stringify(data));
}

const handler: NextApiHandler = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send({ message: "Only POST requests allowed" });
        return;
    }
    const body = pusher_existence_schema.parse(req.body);
    console.log("Received pusher existence event");
    await Promise.all(body.events.map(handle_event));
    res.status(200).send("Success");
};

export default handler;
