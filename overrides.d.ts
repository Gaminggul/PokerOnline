export declare global {
    interface Array<T> {
        map<U>(
            callbackfn: (value: T, index: number, array: T[]) => U,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            thisArg?: any
        ): { [K in keyof this]: U };
    }
}
