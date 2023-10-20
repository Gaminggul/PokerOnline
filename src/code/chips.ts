import { panic } from "functional-utilities";
import { InfiniteArray } from "./infinite_array";

const colors = [
    "White",
    "Red",
    "Blue",
    "Green",
    "Black",
    "Yellow",
    "Orange",
    "Purple",
    "Cyan",
    "Pink",
    "Light Blue",
    "Light Green",
    "Grey",
    "Light Purple",
    "Light Cyan",
    "Dark Blue",
    "Dark Green",
    "Dark Purple",
    "Dark Cyan",
];

type Chip = {
    color: string;
    value: number;
};

export const chips: InfiniteArray<Chip> = new InfiniteArray((i) => {
    const magnitude = Math.pow(10, Math.floor(i / 2));
    const color = colors[i % colors.length] ?? panic();
    const value = magnitude * (i % 2 === 0 ? 1 : 5);
    return { color, value };
});

export function chips_up_to(value: number): Chip[] {
    if (value == Infinity) {
        throw new Error("Cannot get all chips up to infinity");
    }
    return chips.slice(
        0,
        chips.find_index((chip) => chip.value > value),
    );
}
