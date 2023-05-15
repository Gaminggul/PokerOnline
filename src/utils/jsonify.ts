import {
    ZodArray,
    ZodBoolean,
    ZodDate,
    ZodFirstPartyTypeKind,
    ZodIntersection,
    ZodLiteral,
    ZodMap,
    ZodNullable,
    ZodNumber,
    ZodObject,
    ZodOptional,
    ZodRecord,
    ZodString,
    ZodTuple,
    ZodType,
    ZodUnion,
    z,
} from "zod";

type JsonifiedType<T extends ZodType<any, any, any>> = T extends z.ZodString
    ? z.ZodString
    : T extends z.ZodNumber
    ? z.ZodNumber
    : T extends z.ZodNaN
    ? z.ZodNaN
    : T extends z.ZodBigInt
    ? z.ZodString // JSON doesn't support BigInt
    : T extends z.ZodBoolean
    ? z.ZodBoolean
    : T extends z.ZodDate
    ? z.ZodString // JSON.stringify converts dates to strings
    : T extends z.ZodSymbol
    ? never // Symbols can't be serialized to JSON
    : T extends z.ZodUndefined
    ? z.ZodUndefined
    : T extends z.ZodNull
    ? z.ZodNull
    : T extends z.ZodAny
    ? z.ZodAny
    : T extends z.ZodUnknown
    ? z.ZodUnknown
    : T extends z.ZodNever
    ? z.ZodNever
    : T extends z.ZodVoid
    ? z.ZodVoid
    : T extends z.ZodArray<infer I>
    ? z.ZodArray<JsonifiedType<I>>
    : T extends z.ZodObject<infer P>
    ? z.ZodObject<{ [K in keyof P]: JsonifiedType<P[K]> }>
    : T extends z.ZodUnion<infer U>
    ? z.ZodUnion<
          U extends ZodType<any, any, any>[]
              ? { [K in keyof U]: JsonifiedType<U[K]> }
              : never
      >
    : T extends z.ZodIntersection<infer A, infer B>
    ? z.ZodIntersection<JsonifiedType<A>, JsonifiedType<B>>
    : T extends z.ZodTuple<infer Items>
    ? JsonifiedTuple<Items>
    : T extends z.ZodRecord<infer V>
    ? z.ZodRecord<JsonifiedType<V>>
    : T extends z.ZodMap<infer K, infer V>
    ? z.ZodArray<z.ZodTuple<[JsonifiedType<K>, JsonifiedType<V>]>>
    : T extends z.ZodSet<infer I>
    ? z.ZodArray<JsonifiedType<I>>
    : T extends z.ZodFunction<any, any>
    ? never // Functions can't be serialized to JSON
    : T extends z.ZodLazy<any>
    ? T
    : T extends z.ZodLiteral<any>
    ? T
    : T extends z.ZodEnum<any>
    ? z.ZodUnion<[z.ZodString, z.ZodNumber]>
    : T extends z.ZodNativeEnum<any>
    ? z.ZodUnion<[z.ZodString, z.ZodNumber]>
    : T extends z.ZodOptional<infer I>
    ? z.ZodOptional<JsonifiedType<I>>
    : T extends z.ZodNullable<infer N>
    ? z.ZodNullable<JsonifiedType<N>>
    : T extends z.ZodDefault<infer D>
    ? z.ZodDefault<JsonifiedType<D>>
    : T extends z.ZodPromise<infer P>
    ? z.ZodPromise<JsonifiedType<P>>
    : T extends z.ZodEffects<any, any>
    ? T // Effects can't be reliably serialized
    : T extends z.ZodBranded<any, any>
    ? T // Branding can't be reliably serialized
    : T extends z.ZodPipeline<any, any>
    ? T // Pipelines can't be reliably serialized
    : T extends z.ZodCatch<infer C>
    ? z.ZodCatch<JsonifiedType<C>>
    : never; // Catch can't be reliably serialized

type JsonifiedTuple<T extends readonly ZodType<any, any, any>[]> = {
    [P in keyof T]: T[P] extends ZodType<any, any, any>
        ? JsonifiedType<T[P]>
        : never;
};

function isZodObject(schema: ZodType<any, any, any>): schema is ZodObject<any> {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodObject;
}

function isZodArray(schema: ZodType<any, any, any>): schema is ZodArray<any> {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodArray;
}

function isZodOptional(
    schema: ZodType<any, any, any>
): schema is ZodOptional<any> {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodOptional;
}

function isZodNullable(
    schema: ZodType<any, any, any>
): schema is ZodNullable<any> {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodNullable;
}

function isZodUnion(schema: ZodType<any, any, any>): schema is ZodUnion<any> {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodUnion;
}

// function isZodIntersection(
//     schema: ZodType<any, any, any>
// ): schema is ZodIntersection<any, any> {
//     return schema._def.typeName === ZodFirstPartyTypeKind.ZodIntersection;
// }

function isZodTuple(schema: ZodType<any, any, any>): schema is ZodTuple<any> {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodTuple;
}

function isZodRecord(schema: ZodType<any, any, any>): schema is ZodRecord<any> {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodRecord;
}

function isZodLiteral(
    schema: ZodType<any, any, any>
): schema is ZodLiteral<any> {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodLiteral;
}

function isZodDate(schema: ZodType<any, any, any>): schema is ZodDate {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodDate;
}

// function isZodMap(schema: ZodType<any, any, any>): schema is ZodMap<any, any> {
//     return schema._def.typeName === ZodFirstPartyTypeKind.ZodMap;
// }

function isZodString(schema: ZodType<any, any, any>): schema is ZodString {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodString;
}

function isZodNumber(schema: ZodType<any, any, any>): schema is ZodNumber {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodNumber;
}

function isZodBoolean(schema: ZodType<any, any, any>): schema is ZodBoolean {
    return schema._def.typeName === ZodFirstPartyTypeKind.ZodBoolean;
}

export function jsonifySchema<T extends ZodType<any, any, any>>(
    schema: T
): JsonifiedType<T> {
    if (isZodObject(schema)) {
        const objectShape = schema.shape;
        const jsonifiedObjectShape: {
            [K in keyof typeof objectShape]: JsonifiedType<
                (typeof objectShape)[K]
            >;
        } = {} as any;
        for (const key in objectShape) {
            jsonifiedObjectShape[key] = jsonifySchema(objectShape[key]);
        }
        return z.object(jsonifiedObjectShape) as JsonifiedType<T>;
    } else if (isZodArray(schema)) {
        const arrayElementSchema = schema.element;
        return z.array(jsonifySchema(arrayElementSchema)) as JsonifiedType<T>;
    } else if (isZodOptional(schema)) {
        const optionalInnerSchema = schema.unwrap();
        return z.optional(
            jsonifySchema(optionalInnerSchema)
        ) as JsonifiedType<T>;
    } else if (isZodNullable(schema)) {
        const nullableInnerSchema = schema.unwrap();
        return z.nullable(
            jsonifySchema(nullableInnerSchema)
        ) as JsonifiedType<T>;
    } else if (isZodUnion(schema)) {
        const unionSchemas = schema.options;
        return z.union(unionSchemas.map(jsonifySchema)) as JsonifiedType<T>;
    } else if (isZodTuple(schema)) {
        const tupleSchemas = schema.items;
        return z.tuple(
            tupleSchemas.map(jsonifySchema)
        ) as unknown as JsonifiedType<T>;
    } else if (isZodRecord(schema)) {
        const recordValueSchema = schema.valueSchema;
        return z.record(
            jsonifySchema(recordValueSchema)
        ) as unknown as JsonifiedType<T>;
    } else if (isZodString(schema)) {
        return z.string() as JsonifiedType<T>;
    } else if (isZodNumber(schema)) {
        return z.number() as JsonifiedType<T>;
    } else if (isZodBoolean(schema)) {
        return z.boolean() as JsonifiedType<T>;
        // } else if (isZodMap(schema)) {
        //     const [keySchema, valueSchema] = schema.schemas;
        //     return z.array(
        //         z.tuple([jsonifySchema(keySchema), jsonifySchema(valueSchema)])
        //     ) as JsonifiedType<T>;
        // } else if (isZodIntersection(schema)) {
        //     const [leftSchema, rightSchema] = schema.schemas;
        //     return z.intersection(
        //         jsonifySchema(leftSchema),
        //         jsonifySchema(rightSchema)
        //     ) as JsonifiedType<T>;
    } else if (isZodLiteral(schema)) {
        return schema as JsonifiedType<T>;
    } else if (isZodDate(schema)) {
        return z.string().datetime() as JsonifiedType<T>;
    } else {
        throw new Error(
            `jsonifySchema: Unsupported schema type: ${
                (schema as any)._def.typeName
            }`
        );
    }
}
