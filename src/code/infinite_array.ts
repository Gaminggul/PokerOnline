import { panic, range } from "functional-utilities";

class InfiniteArray<T> {
    private func: (i: number) => T;
    private cache: T[] = [];

    constructor(fn: (i: number) => T) {
        this.func = fn;
    }

    get(index: number): T {
        this.cache.push(
            ...range(index + 1 - this.cache.length).map((i) => this.func(i)),
        );
        return this.cache[index] ?? panic();
    }

    slice(start: number, end: number): T[] {
        this.get(end - 1);
        return this.cache.slice(start, end);
    }

    map<U>(fn: (value: T, index: number) => U): InfiniteArray<U> {
        return new InfiniteArray((i) => fn(this.get(i), i));
    }
}
