/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

export type ConvertToJson<T> = T extends Date
    ? string
    : T extends bigint
    ? never
    : T extends (...args: any) => any
    ? never
    : T extends undefined
    ? never
    : T extends Map<any, any>
    ? never
    : T extends Set<any>
    ? never
    : T extends Array<infer U>
    ? JsonTypeArray<U>
    : T extends object
    ? JsonTypeObject<T>
    : T;

type JsonTypeArray<T> = Array<JsonTypeObject<T>>;

type JsonTypeObject<T> = {
    [K in keyof T]: ConvertToJson<T[K]>;
};

import { ZodObject, type ZodType } from "zod";
import { jsonifySchema } from "./jsonify";

type ZodTransformer<T extends ZodType<any, any, any>> = T extends ZodType<
    infer U,
    any,
    any
>
    ? ZodType<U, any, any>
    : never;

export function createJsonSchema<T extends ZodObject<any, any, any>>(
    schema: T
): ZodTransformer<T> {
    return jsonifySchema(schema).transform<ZodType<any, any, any>>((input) => {
        const parsedInput = Object.entries(input).reduce(
            (acc, [key, value]) => {
                const fieldSchema =
                    schema.shape[key as keyof typeof schema.shape];

                if (fieldSchema._def.typeName) {
                    if (fieldSchema._def.typeName === "ZodDate") {
                        acc[key] = new Date(value as string);
                    } else {
                        acc[key] = value;
                    }
                }

                return acc;
            },
            {} as any
        );

        return parsedInput;
    }) as unknown as ZodTransformer<T>;
}
