import { z } from "zod";

export const TimerObjectSchema = z.object({
    id: z.string(),
    purpose: z.literal("disconnect"),
    date: z.date(),
    user_id: z.string(),
});
