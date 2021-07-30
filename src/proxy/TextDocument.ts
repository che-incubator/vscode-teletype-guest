import * as vscode from 'vscode';

export class TextDocument implements vscode.TextDocument {
  uri: vscode.Uri;
  fileName: string;
  isUntitled: boolean;
  languageId: string;
  version: number;
  isDirty: boolean;
  isClosed: boolean;

  eol: vscode.EndOfLine;
  lineCount: number;

  constructor(uri: vscode.Uri) {
    this.uri = uri;
    this.fileName = uri.path;
    this.eol = vscode.EndOfLine.LF;
    this.lineCount = 0;
    this.languageId = '';
    this.version = 0;
    this.isUntitled = false;
    this.isDirty = false;
    this.isClosed = false;
  }

  save(): Thenable<boolean> {
    throw new Error('Method not implemented.');
  }

  lineAt(lineOrPosition: number | vscode.Position): vscode.TextLine {
    throw new Error('Method not implemented.');
  }

  offsetAt(position: vscode.Position): number {
    throw new Error('Method not implemented.');
  }

  positionAt(offset: number): vscode.Position {
    throw new Error('Method not implemented.');
  }

  getText(range?: vscode.Range): string {
    throw new Error('Method not implemented.');
  }

  getWordRangeAtPosition(position: vscode.Position, regex?: RegExp): vscode.Range | undefined {
    throw new Error('Method not implemented.');
  }

  validateRange(range: vscode.Range): vscode.Range {
    throw new Error('Method not implemented.');
  }

  validatePosition(position: vscode.Position): vscode.Position {
    throw new Error('Method not implemented.');
  }
}
