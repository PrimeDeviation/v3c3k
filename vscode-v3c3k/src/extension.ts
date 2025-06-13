import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ApiKeyManager } from './apiKeyManager';

const execAsync = promisify(exec);

export async function activate(context: vscode.ExtensionContext) {
    const apiKeyManager = ApiKeyManager.getInstance(context);

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
    let checkCLI = vscode.commands.registerCommand('v3c3k.checkCLI', async () => {
        try {
            const { stdout } = await execAsync('v3c3k --version');
            vscode.window.showInformationMessage(`v3c3k CLI version: ${stdout.trim()}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to execute v3c3k CLI command');
        }
    });

    let setApiKey = vscode.commands.registerCommand('v3c3k.setApiKey', async () => {
        const model = await vscode.window.showQuickPick(['gpt-4', 'gpt-3.5-turbo'], {
            placeHolder: 'Select AI model'
        });
        if (!model) return;

        const key = await vscode.window.showInputBox({
            prompt: `Enter API key for ${model}`,
            password: true
        });
        if (!key) return;

        await apiKeyManager.setApiKey(model, key);
        vscode.window.showInformationMessage(`API key for ${model} saved successfully`);
    });

    let checkApiKey = vscode.commands.registerCommand('v3c3k.checkApiKey', async () => {
        const model = await vscode.window.showQuickPick(['gpt-4', 'gpt-3.5-turbo'], {
            placeHolder: 'Select AI model'
        });
        if (!model) return;

        const hasKey = await apiKeyManager.hasApiKey(model);
        vscode.window.showInformationMessage(
            hasKey ? `API key for ${model} is configured` : `No API key found for ${model}`
        );
    });

    context.subscriptions.push(checkCLI, setApiKey, checkApiKey);
}

export function deactivate() {} 