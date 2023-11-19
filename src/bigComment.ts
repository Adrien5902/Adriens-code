import * as vscode from 'vscode';
import comments from "./langs-comments.json"
import { getEditor, getIndent } from './functions';

interface CommentType{
	single: string,
	multiStart: string,
	multiEnd: string
}

export async function bigComment(){
	const editor = getEditor()

	const languageId = editor.document.languageId;
	//@ts-ignore
	let comment: CommentType | undefined = comments[languageId]

	if(!comment){
		const input = await vscode.window.showInputBox({
			placeHolder: `${languageId} comments characters...`,
			prompt: `Couldn't find single line comments for this language type what characters are used for comments in ${languageId}`
		})

		if(!input) return

		const halfInputLength = Math.floor(input.length/2)
		comment = {
			multiStart: input.slice(0, halfInputLength) ?? input,
			multiEnd: input.slice(halfInputLength) ?? input,
			single: input
		}
	}

	const firstChar = comment.single[0]
	const canUseSingle = comment.single.split("").reduce((prev, curr) => prev && curr == firstChar, true)

	const selections = editor.selections.map(s => s.active)
	for(const selection of selections){
		const line = editor.document.lineAt(selection.line)
		const indent = getIndent(line)
		const text = line.text.replace(indent, "")
		const topAndBot = indent + (canUseSingle ?
			comment.single.repeat(Math.floor(text.length/comment.single.length) + 2)
			 	+ comment.single.slice(0, text.length % comment.single.length) ?? ""
			: 
			comment.multiStart + comment.multiStart.slice(-1).repeat(text.length) + comment.multiEnd
		)

		editor.edit((edit) => {
			edit.replace(
				line.range,
				`${topAndBot}\n${indent}${canUseSingle ? comment?.single : comment?.multiStart}${text}${canUseSingle ? comment?.single : comment?.multiEnd}\n${topAndBot}`
			)
		})
	}
}