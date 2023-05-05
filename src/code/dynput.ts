type Validator<T> = (
    str: T
) => { valid: true } | { valid: false; error: string };

type StringInput = {
    type: "string";
    validator?: Validator<string>;
};

type NumberInput = {
    type: "number";
    validator?: Validator<number>;
};

type BooleanInput = {
    type: "boolean";
};

type DateInput = {
    type: "date";
    validator?: Validator<Date>;
};

type ObjectInput = {
    type: "object"; // All may be filled, each is an entry in the object
    schema: ReadonlyArray<InputSchema & Descriptor & { key: string }>;
};

type StaticInput = {
    type: "static";
    value: any;
};

type OptionalInput = {
    type: "optional";
    input: InputSchema;
};

type UnionInput = {
    inputs: (
        | BooleanInput
        | { type: "selectable_input"; schema: Exclude<InputSchema, UnionInput> }
    )[];
    type: "union"; // Only one may be filled, the output is a union of the inputs
};

type TupleInput = {
    inputs: (BooleanInput | OptionalInput)[];
    type: "tuple"; // All may be filled, the output is a tuple of the inputs
};

type IntersectInput = {
    inputs: InputSchema[];
    type: "intersect"; // All must be filled, the output is an intersection of the inputs
};

type ArrayInput = {
    type: "array";
    input: InputSchema;
};

type RecursiveInput = () => InputSchema;

type Descriptor = {
    name?: string;
    description?: string;
};

export type InputSchema =
    | StringInput
    | NumberInput
    | BooleanInput
    | DateInput
    | ObjectInput
    | StaticInput
    | OptionalInput
    | UnionInput
    | TupleInput
    | IntersectInput
    | RecursiveInput
    | ArrayInput;
