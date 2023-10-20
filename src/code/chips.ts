import { panic, range } from "functional-utilities";

const colors = [
    "white",
    "red",
    "green",
    "blue",
    // ...
];

type Chip = {
    color: string;
    value: number;
};

function generate_chips(n: number): Chip[] {
    // 1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 50000, ...
    return range(n).map((i) => {
        const magnitude = Math.pow(10, Math.floor(i / 2));
        const color = colors[i % colors.length] ?? panic();
        const value = magnitude * (i % 2 === 0 ? 1 : 5);
        return { color, value };
    });
}
