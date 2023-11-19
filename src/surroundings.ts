
export interface Surrounding {
    open: string;
    close: string;
}

export interface SurroundingPos {
    open: number;
    close: number;
}

export const brackets: Surrounding[] = [
    {
        open: "{",
        close: "}"
    },
    {
        open: "(",
        close: ")"
    },
    {
        open: "[",
        close: "]"
    },
];

export const quotes = ["\"", "\'", "`"];

export function getSurroundings(str: string, surroundings = brackets) :SurroundingPos[] {
	const positions: { open: number, close: number }[] = []
	for (let surrounding of surroundings) {
		const stack = [];

		for (let i = 0; i < str.length; i++) {
			if (str[i] === surrounding.open) {
				stack.push(i);
			} else if (str[i] === surrounding.close) {
				if (stack.length > 0) {
					positions.push({ open: stack.pop() as number, close: i });
				}
			}
		}
	}

	return positions
}

export function getCloseSurrounding(text: string, pos: number, surroundings? :Surrounding[]) :SurroundingPos | null {
	const gottenSurroundings = getSurroundings(text, surroundings)
		.map(s => ({
			open: (pos - 1) - s.open,
			close: s.close - pos
		}))
		.filter((s) => s.open >= 0 && s.close >= 0)

	const closestSurrounding = gottenSurroundings.length ? gottenSurroundings
		.reduce((min, curr) =>
			curr.open < min.open
				||
				curr.close < min.close
				? curr : min
		) : null

	if (!closestSurrounding) return null

	closestSurrounding.open = (pos - 1) - closestSurrounding.open
	closestSurrounding.close = pos + closestSurrounding.close

	return closestSurrounding
}

