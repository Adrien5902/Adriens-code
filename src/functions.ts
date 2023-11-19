///////////////////////////////
//Global Functions and Values//
///////////////////////////////

import * as vscode from "vscode";

export const extensionNamespace = "adrien-s-code"

export function getEditor() {
	const editor = vscode.window.activeTextEditor

	if (!editor) {
		throw new AdriensError("Not editing a file")
	}

	return editor
}

export function getIndent(line: vscode.TextLine){
	return line.text.slice(0, line.firstNonWhitespaceCharacterIndex)
}

export class AdriensError extends Error {
	constructor(message: string) {
		super(message)
	}
}

export const commands: vscode.Disposable[] = [];
export function registerCommand(commandName: string, command: (...args: any) => unknown) {
	commands.push(
		vscode.commands.registerCommand(`${extensionNamespace}.${commandName}`, (...args: any) => {
			try {
				command(...args);
			} catch (error) {
				if (error instanceof AdriensError) {
					vscode.window.showErrorMessage(error.message);
				}
			}
		})
	);
}
