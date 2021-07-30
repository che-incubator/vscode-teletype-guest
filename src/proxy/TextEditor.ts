import * as vscode from 'vscode';

export class TextEditor implements vscode.TextEditor {
  document: vscode.TextDocument;
  selection: vscode.Selection;
  selections: vscode.Selection[];
  visibleRanges: vscode.Range[];
  options: vscode.TextEditorOptions;
  viewColumn?: vscode.ViewColumn | undefined;

  constructor(document: vscode.TextDocument) {
    this.document = document;
    this.selections = [];
  }

  edit(callback: (editBuilder: vscode.TextEditorEdit) => void, options?: { undoStopBefore: boolean; undoStopAfter: boolean; }): Thenable<boolean> {
    throw new Error('Method not implemented.');
  }

  insertSnippet(snippet: vscode.SnippetString, location?: vscode.Position | vscode.Range | vscode.Position[] | vscode.Range[], options?: { undoStopBefore: boolean; undoStopAfter: boolean; }): Thenable<boolean> {
    throw new Error('Method not implemented.');
  }

  setDecorations(decorationType: vscode.TextEditorDecorationType, rangesOrOptions: vscode.Range[] | vscode.DecorationOptions[]): void {
    throw new Error('Method not implemented.');
  }

  revealRange(range: vscode.Range, revealType?: vscode.TextEditorRevealType): void {
    throw new Error('Method not implemented.');
  }

  show(column?: vscode.ViewColumn): void {
    throw new Error('Method not implemented.');
  }

  hide() {
    throw new Error('Method not implemented.');
  }
}
