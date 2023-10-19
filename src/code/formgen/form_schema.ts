/* eslint-disable @typescript-eslint/no-explicit-any */

type ValueSchema =
    | {
          type: "subobject";
          style:
              | {
                    type: "inline";
                }
              | {
                    type: "block";
                    title: string;
                    allow_collapse: boolean;
                };
          elements: Record<string, ValueSchema>;
      }
    | {
          type: "union";
          style: "radio";
          elements: Record<string, ValueSchema>;
      }
    | {
          type: "constant";
          value: any;
      }
    | {
          type: "array";
          element: ValueSchema;
      }
    | {
          type: "text_input";
          parse: (value: string) =>
              | {
                    success: true;
                    value: any;
                }
              | {
                    success: false;
                    error: string;
                };
      };

type Parser = (value: string) =>
    | {
          success: true;
          value: any;
      }
    | {
          success: false;
          error: string;
      };

type InferValue<T extends ValueSchema> = T extends { type: "subobject" }
    ? { [K in keyof T["elements"]]: InferValue<T["elements"][K]> }
    : T extends { type: "union" }
    ? {
          [K in keyof T["elements"]]: InferValue<T["elements"][K]>;
      }[keyof T["elements"]]
    : T extends { type: "constant" }
    ? T["value"]
    : T extends { type: "array" }
    ? InferValue<T["element"]>[]
    : T extends { type: "text_input" }
    ? string // Directly resolve to string
    : never;

const testSchema = {
    type: "subobject",
    style: {
        type: "block",
        title: "Test Block",
        allow_collapse: true,
    },
    elements: {
        subobjectField: {
            type: "subobject",
            style: {
                type: "inline",
            },
            elements: {
                nestedField: {
                    type: "text_input",
                    parse: ((value: string) => {
                        if (value.length > 0) {
                            return { success: true, value: value };
                        } else {
                            return {
                                success: false,
                                error: "Input value should not be empty.",
                            };
                        }
                    }) satisfies Parser,
                },
            },
        },
        unionField: {
            type: "union",
            style: "radio",
            elements: {
                option1: { type: "constant", value: "Option1" },
                option2: { type: "constant", value: "Option2" },
            },
        },
        constantField: {
            type: "constant",
            value: "Constant Value",
        },
        arrayField: {
            type: "array",
            element: {
                type: "text_input",
                parse: (value: string) => {
                    if (value.length > 0) {
                        return { success: true, value: value };
                    } else {
                        return {
                            success: false,
                            error: "Input value should not be empty.",
                        };
                    }
                },
            },
        },
        textInputField: {
            type: "text_input",
            parse: (value: string) => {
                if (value.length > 0) {
                    return { success: true, value: value };
                } else {
                    return {
                        success: false,
                        error: "Input value should not be empty.",
                    };
                }
            },
        },
    },
} satisfies ValueSchema;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ = InferValue<typeof testSchema>;
