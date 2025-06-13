import * as vscode from 'vscode';
import { StructureValidationResult, StructureIssue } from './projectStructureManager';

export class StructureValidationPanel {
    public static currentPanel: StructureValidationPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, result: StructureValidationResult) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (StructureValidationPanel.currentPanel) {
            StructureValidationPanel.currentPanel._panel.reveal(column);
            StructureValidationPanel.currentPanel._update(result);
        } else {
            StructureValidationPanel.currentPanel = new StructureValidationPanel(extensionUri, column, result);
        }
    }

    private constructor(extensionUri: vscode.Uri, column: vscode.ViewColumn | undefined, result: StructureValidationResult) {
        this._extensionUri = extensionUri;
        this._panel = vscode.window.createWebviewPanel(
            'structureValidation',
            'Project Structure Validation',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this._update(result);
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    public dispose() {
        StructureValidationPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _update(result: StructureValidationResult) {
        this._panel.webview.html = this._getHtmlForWebview(result);
    }

    private _getHtmlForWebview(result: StructureValidationResult) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-editor-foreground);
                    }
                    .status {
                        font-size: 1.2em;
                        margin-bottom: 20px;
                        padding: 10px;
                        border-radius: 4px;
                    }
                    .valid {
                        background-color: var(--vscode-testing-iconPassed);
                    }
                    .invalid {
                        background-color: var(--vscode-testing-iconFailed);
                    }
                    .issues {
                        margin-top: 20px;
                    }
                    .issue {
                        margin: 10px 0;
                        padding: 10px;
                        border-radius: 4px;
                    }
                    .error {
                        background-color: var(--vscode-errorForeground);
                        color: var(--vscode-editor-background);
                    }
                    .warning {
                        background-color: var(--vscode-editorWarning-foreground);
                        color: var(--vscode-editor-background);
                    }
                    .path {
                        font-family: var(--vscode-editor-font-family);
                        font-size: 0.9em;
                        opacity: 0.8;
                    }
                </style>
            </head>
            <body>
                <div class="status ${result.isValid ? 'valid' : 'invalid'}">
                    ${result.isValid ? '✓ Project structure is valid' : '✗ Project structure has issues'}
                </div>
                ${result.issues.length > 0 ? `
                    <div class="issues">
                        <h2>Issues Found:</h2>
                        ${result.issues.map(issue => `
                            <div class="issue ${issue.type}">
                                <div class="message">${issue.message}</div>
                                <div class="path">${issue.path}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </body>
            </html>
        `;
    }
} 