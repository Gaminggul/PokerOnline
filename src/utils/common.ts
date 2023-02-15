// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop() { }

export type Empty = Record<string, never>;


export function todo(): never {
    throw new Error("TODO");
}