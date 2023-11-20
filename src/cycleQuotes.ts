import * as vscode from 'vscode';
import { getEditor } from './functions';
import { SurroundingPos, quotes } from './surroundings';

interface Quote extends SurroundingPos {
	type: string;
}

export function cycleQuotes() {
	const editor = getEditor();
	const text = editor.document.getText();

	const quoteRegex = /(['"`])(?:(?=(\\?))\2.)*?\1/g;

	const quotesInText: Quote[] = [];
	let match;
	while ((match = quoteRegex.exec(text)) !== null) {
		const type = match[1];
		const open = match.index;
		const close = quoteRegex.lastIndex - 1;

		quotesInText.push({
			type,
			open,
			close,
		});
	}

	for (const selection of editor.selections.map(s => s.active)) {
		const pos = editor.document.offsetAt(selection);
		const filteredQuotes = quotesInText.filter(q => pos >= q.open + 1 && pos <= q.close);

		if (!filteredQuotes.length) continue;

		const closestQuote = filteredQuotes.reduce((prev, curr) => curr.open > prev.open ? curr : prev, filteredQuotes[0]);

		if (!closestQuote) continue;

		const nextQuote = quotes[(quotes.findIndex(q => closestQuote.type == q) + 1) % quotes.length];

		editor.edit((edit) => {
			const openPos = editor.document.positionAt(closestQuote.open);
			edit.replace(new vscode.Range(openPos, openPos.translate(0, 1)), nextQuote);
			const closePos = editor.document.positionAt(closestQuote.close);
			edit.replace(new vscode.Range(closePos, closePos.translate(0, 1)), nextQuote);
		});
	}
}
