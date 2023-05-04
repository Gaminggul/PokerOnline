type Validator<T> = (
    str: T
) => { valid: true } | { valid: false; error: string };

export type InputSchema = Record<
    string,
    | ((
          | {
                type: "string";
                validator?: Validator<string>;
            }
          | {
                type: "number";
                validator?: Validator<number>;
            }
          | {
                type: "boolean";
            }
          | {
                type: "date";
                validator?: Validator<Date>;
            }
      ) &
          Descriptor)
    | {
          type: "subspace";
          schema: InputSchema;
          explicit: Descriptor | undefined;
      }
    | {
          type: "options";
          options: {
              name: string;
              description: string;
              space?: InputSchema;
          }[]
      }
    | {
          type: "always";
          value: unknown;
      }
    | {
          type: "record";
          op
      }
>;

interface Descriptor {
    name: string;
    description: string;
}
