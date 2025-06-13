import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function activate(context: vscode.ExtensionContext) {
    // Check if v3c3k CLI is installed
    try {
        await execAsync('v3c3k --version');
    } catch (error) {
        vscode.window.showErrorMessage(
            'v3c3k CLI not found. Please install it using: npm install -g v3c3k',
            'Install Now'
        ).then((selection: string | undefined) => {
            if (selection === 'Install Now') {
                vscode.window.withProgress({
                    location: vscode.ProgressLocation.Notification,
                    title: "Installing v3c3k CLI...",
                    cancellable: false
                }, async (progress: vscode.Progress<{ message?: string; increment?: number }>) => {
                    try {
                        await execAsync('npm install -g v3c3k');
                        vscode.window.showInformationMessage('v3c3k CLI installed successfully!');
                    } catch (error) {
                        vscode.window.showErrorMessage('Failed to install v3c3k CLI. Please install manually.');
                    }
                });
            }
        });
        return;
    }

    // Register commands
    let disposable = vscode.commands.registerCommand('v3c3k.checkCLI', async () => {
        try {
            const { stdout } = await execAsync('v3c3k --version');
            vscode.window.showInformationMessage(`v3c3k CLI version: ${stdout.trim()}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to execute v3c3k CLI command');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {} 