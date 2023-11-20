import * as vscode from 'vscode';
import { bigComment } from './bigComment';
import { changeSurround, deleteSurround } from "./surroundCommands";
import { registerCommand, commands } from './functions';
import { supportedCssFiles, decorateFlexes } from './flexCheat';
import { flexCheatCommand } from './flexCheat';
import { cycleQuotes } from './cycleQuotes';

export function activate(context: vscode.ExtensionContext) {
	registerCommand('changeSurround', changeSurround)
	registerCommand('deleteSurround', deleteSurround)

	registerCommand("cycleQuotes", cycleQuotes)

	registerCommand('bigComment', bigComment)
	
	registerCommand("flexCheat", flexCheatCommand)

	function documentChange(){
		const editor = vscode.window.activeTextEditor
		if (editor && supportedCssFiles.includes(editor.document.languageId)) {
			decorateFlexes()
		}
	}

	documentChange()

	const cssFlexDisposable = [
		vscode.window.onDidChangeVisibleTextEditors(documentChange),
		vscode.workspace.onDidChangeTextDocument(documentChange)
	]

	const disposables = [commands, cssFlexDisposable]

	context.subscriptions.push(...disposables.flat(1));
}

export function deactivate() { }