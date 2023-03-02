import type { Access } from "@prisma/client";
import { z } from "zod";

export const AccessSchema = z.union([
    z.literal("public"),
    z.literal("private"),
])

export type AccessType = z.infer<typeof AccessSchema>;



const _type_assertion1: Access = "public";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _type_assertion2: AccessType = _type_assertion1;