import * as vscode from 'vscode';

const extensionNamespace = "adrien-s-code"

interface Surrounding{
	open: string
	close: string
}

const brackets: Surrounding[] = [
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
]

const quotes = ["\"", "\'", "`"]

class AdriensError extends Error{
	constructor(message: string){
		super(message)
	}
}

function getSurroundings(str: string) {
	const positions: {open: number, close: number}[] = []
	for(let surrounding of brackets){
		const stack = [];
	
		for (let i = 0; i < str.length; i++) {
			if (str[i] === surrounding.open) {
				stack.push(i);
			} else if (str[i] === surrounding.close) {
				if (stack.length > 0) {
					positions.push({ open: stack.pop() as number, close: i});
				}
			}
		}
	}
	
	return positions
}

function getEditor(){
	const editor = vscode.window.activeTextEditor

	if(!editor){
		throw new AdriensError("Not editing a file")
	}
	
	return editor
}

function getCloseSurrounding(text: string, pos: number){
	const gottenSurroundings = getSurroundings(text)
	.map(s => ({
		open: (pos - 1) - s.open,
		close: s.close - pos
	}))
	.filter((s) => s.open >= 0 && s.close >= 0)

	const closestSurrounding =  gottenSurroundings.length ? gottenSurroundings
	.reduce((min, curr) => 
		curr.open < min.open
		||
		curr.close < min.close
		? curr : min
	) : null

	if(!closestSurrounding) return null
					
	closestSurrounding.open = (pos - 1) - closestSurrounding.open
	closestSurrounding.close = pos + closestSurrounding.close

	return closestSurrounding
}

function changeSurround(){
	const editor = getEditor()
	
	const selections = editor.selections.map(s => s.active)
	for(let selection of selections){
		const text = editor.document.getText()
		const closestSurrounding = getCloseSurrounding(text, editor.document.offsetAt(selection))

		if(!closestSurrounding) return

		const input = vscode.window.createInputBox()
		input.show()
		input.placeholder = "Replace with..."
		input.onDidChangeValue(newCharacter => {
			input.hide()
		
			if(!newCharacter){
				return
			}

			const bracket = brackets.find(b => b.open == newCharacter || b.close == newCharacter)

			const openPosition = editor.document.positionAt(closestSurrounding.open)
			const closePosition = editor.document.positionAt(closestSurrounding.close)
			editor.edit(edit => {
				edit.replace(new vscode.Range(openPosition, openPosition.translate(0, 1)), bracket ? bracket.open : newCharacter)
				edit.replace(new vscode.Range(closePosition, closePosition.translate(0, 1)), bracket ? bracket.close : newCharacter)
			})
		})
	}
}

function deleteSurround(){
	const editor = getEditor()
	
	const selections = editor.selections.map(s => s.active)
	for(let selection of selections){
		const text = editor.document.getText()
		const closestSurrounding = getCloseSurrounding(text, editor.document.offsetAt(selection))

		if(!closestSurrounding) return

		const openPosition = editor.document.positionAt(closestSurrounding.open)
		const closePosition = editor.document.positionAt(closestSurrounding.close)
		editor.edit(edit => {
			edit.delete(new vscode.Range(openPosition, openPosition.translate(0, 1)))
			edit.delete(new vscode.Range(closePosition, closePosition.translate(0, 1)))
		})
	}
}

const commands: vscode.Disposable[] = []
function registerCommand(commandName :string, command: (...args: any) => unknown){
	commands.push(
		vscode.commands.registerCommand(`${extensionNamespace}.${commandName}`, () => {
			try {
				command()
			} catch (error) {
				if(error instanceof AdriensError){
					vscode.window.showErrorMessage(error.message)
				}
			}
		})
	)
}

export function activate(context: vscode.ExtensionContext) {
	registerCommand('changeSurround', changeSurround)
	registerCommand('deleteSurround', deleteSurround)

	const disposables = [commands]

	context.subscriptions.push(...disposables.flat(1));
}

export function deactivate() {}