export type ConvertToJson<T> = T extends Date
    ? string
    : T extends BigInt
    ? never
    : T extends Function
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

import { ZodObject, ZodType } from "zod";

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
    return schema.transform<ZodType<any, any, any>>((input) => {
        const parsedInput = Object.entries(input).reduce(
            (acc, [key, value]) => {
                const fieldSchema =
                    schema.shape[key as keyof typeof schema.shape];

                if (fieldSchema instanceof ZodType) {
                    if (fieldSchema._def.typeName === "ZodDate") {
                        acc[key] = new Date(value);
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
