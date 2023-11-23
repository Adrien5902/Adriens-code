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
	const startComment = canUseSingle ? comment?.single : comment?.multiStart
	const endComment = canUseSingle ? comment?.single : comment?.multiEnd

	for(const selection of editor.selections){
		const isSelection = !selection.start.isEqual(selection.end)
		const lineNumber = selection.active.line
		const line = editor.document.lineAt(lineNumber)
		
		const indent = getIndent(line)
		
		let startLine = null
		let endLine = null
		for(const direction of [-1, 1]){
			let currentLineBigComment = true
			let fullCommentLine = false

			let i = 0

			directionloop: while(currentLineBigComment){
				try {
					const lineN = lineNumber + i
					const text = editor.document.getText(editor.document.lineAt(lineN).range) 
					currentLineBigComment == text.startsWith(startComment) && text.endsWith(endComment)

					fullCommentLine = text.split("").reduce((prev, curr) => prev && !!(
						comment?.single.includes(curr) 
						|| comment?.multiStart.includes(curr) 
						|| comment?.multiEnd.includes(curr)
					), true)

					if(fullCommentLine){
						if(direction >= 1){
							startLine = lineN - direction
						}else{
							endLine = lineN - direction
						}

						break directionloop
					}

					i += direction
				} catch (error) {
					if(error instanceof Error && error.message == "Illegal value for `line`"){
						break directionloop
					}else{
						throw error
					}
				}
			}
		}

		console.log(startLine, endLine)
		
		const needToRemove = startLine && endLine

		if(!needToRemove){
			const range = isSelection ? new vscode.Range(selection.start, selection.end) : line.range
			const text = editor.document.getText(range).replace(indent, "")
			const texts = text.split(/\r?\n|\r|\n/g)
	
			const longestText = texts.reduce((prev, curr) => prev.length > curr.length ? prev : curr)
	
			const topAndBot = indent + (canUseSingle ?
				comment.single.repeat(Math.floor(longestText.length/comment.single.length) + 2)
					 + comment.single.slice(0, longestText.length % comment.single.length) ?? ""
				: 
				comment.multiStart + comment.multiStart.slice(-1).repeat(longestText.length) + comment.multiEnd
			)
	
			const newTexts = texts.map((t) => 
				`${indent}${startComment}${t}${" ".repeat(longestText.length - t.length)}${endComment}`
			)
	
			editor.edit((edit) => {
				edit.replace(
					range,
					`${topAndBot}\n${newTexts.join("\n")}\n${topAndBot}`
				)
			})
		}else{
			console.log("remove")
		}
	}
}