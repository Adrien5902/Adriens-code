import { getEditor } from "./functions";
import * as vscode from 'vscode';
import { getCloseSurrounding, brackets } from "./surroundings";

export function changeSurround() {
    const editor = getEditor();

    const selections = editor.selections.map(s => s.active);
    for (let selection of selections) {
        const text = editor.document.getText();
        const closestSurrounding = getCloseSurrounding(text, editor.document.offsetAt(selection));

        if (!closestSurrounding) return;

        const input = vscode.window.createInputBox();
        input.show();
        input.placeholder = "Replace with...";
        input.onDidChangeValue(newCharacter => {
            input.hide();

            if (!newCharacter) {
                return;
            }

            const bracket = brackets.find(b => b.open == newCharacter || b.close == newCharacter);

            const openPosition = editor.document.positionAt(closestSurrounding.open);
            const closePosition = editor.document.positionAt(closestSurrounding.close);
            editor.edit(edit => {
                edit.replace(new vscode.Range(openPosition, openPosition.translate(0, 1)), bracket ? bracket.open : newCharacter);
                edit.replace(new vscode.Range(closePosition, closePosition.translate(0, 1)), bracket ? bracket.close : newCharacter);
            });
        });
    }
}

export function deleteSurround() {
    const editor = getEditor();

    const selections = editor.selections.map(s => s.active);
    for (let selection of selections) {
        const text = editor.document.getText();
        const closestSurrounding = getCloseSurrounding(text, editor.document.offsetAt(selection));

        if (!closestSurrounding) return;

        const openPosition = editor.document.positionAt(closestSurrounding.open);
        const closePosition = editor.document.positionAt(closestSurrounding.close);
        editor.edit(edit => {
            edit.delete(new vscode.Range(openPosition, openPosition.translate(0, 1)));
            edit.delete(new vscode.Range(closePosition, closePosition.translate(0, 1)));
        });
    }
}
