import type { NextApiHandler } from "next";
import { createJsonSchema } from "../../utils/json_util";
import { TimerObjectSchema } from "../../code/timer_obj";
import { prisma } from "../../server/db";
import { panic } from "functional-utilities";
import dayjs from "dayjs";
import { disconnect_user } from "../../code/disconnect";

const handler: NextApiHandler = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send({ message: "Only POST requests allowed" });
        return;
    }
    const timer = createJsonSchema(TimerObjectSchema).parse(req.body);
    console.log("Got timer event", timer);

    if (timer.purpose === "disconnect") {
        const user =
            (await prisma.user.findUnique({
                where: {
                    id: timer.user_id,
                },
                select: {
                    timeout: true,
                },
            })) ?? panic("User not found");
        const timeout = user.timeout;
        if (!timeout) {
            res.status(200).send("Success");
            return;
        }
        const timed_out = dayjs().isAfter(dayjs(timeout));
        if (timed_out) {
            await disconnect_user(timer.user_id);
        }
    }

    res.status(200).send("Success");
};

export default handler;
