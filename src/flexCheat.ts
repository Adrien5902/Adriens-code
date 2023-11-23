import * as vscode from 'vscode';
import { AdriensError, extensionNamespace, getEditor, getIndent } from './functions';
import { SurroundingPos, brackets } from './surroundings';
import { getCloseSurrounding } from './surroundings';

const flexDecoration = vscode.window.createTextEditorDecorationType({
	after: {
		margin: "0 .2rem 0 .5rem",
		contentText: "Flex Cheat",
		width: "auto",
		color: "rgba(0, 190, 50, .9)",
		backgroundColor: "rgba(0, 255, 50, .05)"
	}
});

const CSSFlexProperties = {
	"flex-direction": ["row", "column", "row-reverse", "column-reverse"],
	"flex-wrap": ["wrap", "nowrap"],
	"align-content": ["center", "flex-start", "flex-end", "space-around", "space-between", "stretch"],
	"justify-content": ["center", "flex-start", "flex-end", "space-around", "space-between", "space-evenly"],
	"align-items": ["center", "stretch", "baseline"],
};

type FlexPropertiesKeys = keyof typeof CSSFlexProperties;
type FlexBoxProperties = Record<FlexPropertiesKeys, CSSPropertyValue | undefined>;
interface CSSPropertyValue {
	pos: SurroundingPos;
	value: string;
}

function getCSSPropertyValue(str: string, property: string): CSSPropertyValue | undefined {
	const propertyIndex = str.indexOf(property);
	if (propertyIndex < 0) return undefined;

	const colonIndex = str.indexOf(":", propertyIndex);
	if (colonIndex < 0) return undefined;

	const semiColonIndex = str.indexOf(";", colonIndex);
	if (semiColonIndex < 0) return undefined;

	const pos = { open: colonIndex + 1, close: semiColonIndex };

	return {
		pos,
		value: str.slice(pos.open, pos.close).replaceAll(" ", "")
	};
}

export interface FlexCheatArguments {
	property: FlexPropertiesKeys;
	value: string;
	pos: SurroundingPos;
}

function flexMarkDown(editor: vscode.TextEditor, pos: vscode.Position) {
	const text = editor.document.getText();
	const bracketsPos = getCloseSurrounding(text, editor.document.offsetAt(pos), [brackets[0]]);

	if (!bracketsPos) throw new AdriensError("Not in a css bracket {}");

	const display = "flex";

	return [
		new vscode.MarkdownString(`display: ${display}`),
		...Object.keys(CSSFlexProperties).map((property) => {
			const strings: string[] = [];
			const values = CSSFlexProperties[property as FlexPropertiesKeys];

			for (const value of values) {
				const args = encodeURIComponent(JSON.stringify({
					property,
					value,
					pos: bracketsPos,
				} as FlexCheatArguments));

				const command = vscode.Uri.parse(`command:${extensionNamespace}.flexCheat?${encodeURIComponent(JSON.stringify(args))}`);
				const str = `[${value}](${command} "Set ${property} to ${value}")`;

				strings.push(str);
			}

			const md = new vscode.MarkdownString(`\n\n${property}: ` + strings.reduce((prev, curr) => prev + " | " + curr));
			md.isTrusted = true;
			return md;
		}).flat(1)
	];
}

export const supportedCssFiles = ['css', 'less', 'sass', 'scss'];

export function decorateFlexes() {
	const editor = getEditor();

	const flexDisplay = "display: flex";

	const positions: vscode.Position[] = [];

	for (let lineCount = 0; lineCount < editor.document.lineCount; lineCount++) {
		const line = editor.document.lineAt(lineCount);
		const indexOfFlex = line.text.indexOf(flexDisplay);
		if (indexOfFlex >= 0) {
			const position = new vscode.Position(line.lineNumber, indexOfFlex + flexDisplay.length);
			positions.push(position);
		}
	}

	editor.setDecorations(flexDecoration, positions.map((pos) => ({
		range: new vscode.Range(pos, pos.translate(0, 1)),
		hoverMessage: (() => {
			try {
				return flexMarkDown(editor, pos);
			} catch (error) {
				if (error instanceof AdriensError) {
					vscode.window.showErrorMessage(error.message);
				}
			}
		})()
	})));
}

export function flexCheatCommand(args: string) {
	const { pos, property, value} = JSON.parse(decodeURIComponent(args)) as FlexCheatArguments;
	const editor = getEditor();

	const text = editor.document.getText()
	const bracketsSlicedText = text.slice(pos.open, pos.close)

	editor.edit((edit) => {
		const currentValue = getCSSPropertyValue(bracketsSlicedText, property)

		if (currentValue) {
			edit.replace(
				new vscode.Range(
					editor.document.positionAt(pos.open + currentValue.pos.open), 
					editor.document.positionAt(pos.open + currentValue.pos.close)
				),
				` ${value}`
			);
		} else {
			const p = editor.document.positionAt(pos.close);
			const line = editor.document.lineAt(p.translate(-1));
			edit.insert(p, `${getIndent(line)}${property}: ${value};\n`);
		}
	});
}

