import { panic, range } from "functional-utilities";

export class InfiniteArray<T> {
    private func: (i: number) => T;
    private cache: T[] = new Array<T>();

    constructor(fn: (i: number) => T) {
        this.func = fn;
    }

    get(index: number): T {
        return this.cache[index] ?? (this.cache[index] = this.func(index));
    }

    slice(start: number, end: number): T[] {
        return range(start, end).map((i) => this.get(i));
    }

    map<U>(fn: (value: T, index: number) => U): InfiniteArray<U> {
        return new InfiniteArray((i) => fn(this.get(i), i));
    }

    filter(fn: (value: T, index: number) => boolean): InfiniteArray<T> {
        const current: T[] = [];
        let index = 0;

        return new InfiniteArray((i) => {
            while (current.length <= i) {
                const value = this.get(index++);
                if (fn(value, index)) {
                    current.push(value);
                }
            }
            return current[i] ?? panic();
        });
    }

    flatMap<U>(fn: (value: T, index: number) => U[]): InfiniteArray<U> {
        const current: U[] = [];
        let index = 0;

        return new InfiniteArray((i) => {
            while (current.length <= i) {
                const value = this.get(index++);
                const mapped = fn(value, index);
                current.push(...mapped);
            }
            return current[i] ?? panic();
        });
    }

    find(fn: (value: T, index: number) => boolean): T {
        let index = 0;
        while (true) {
            const value = this.get(index++);
            if (fn(value, index)) {
                return value;
            }
        }
    }

    find_index(fn: (value: T, index: number) => boolean): number {
        let index = 0;
        while (true) {
            const value = this.get(index++);
            if (fn(value, index)) {
                return index;
            }
        }
    }
}
