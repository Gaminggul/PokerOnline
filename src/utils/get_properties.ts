/* eslint-disable @typescript-eslint/no-explicit-any */

export type GetProperties<T> = Pick<
    T,
    {
        [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
    }[keyof T]
>;
