import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ApiKeyManager } from './apiKeyManager';
import { FeatureTreeProvider, FeatureTreeItem } from './featureTreeProvider';
import { ProjectStructureManager } from './projectStructureManager';
import { StructureValidationPanel } from './structureValidationPanel';

const execAsync = promisify(exec);

export async function activate(context: vscode.ExtensionContext) {
    const apiKeyManager = ApiKeyManager.getInstance(context);
    const featureTreeProvider = new FeatureTreeProvider();
    const projectStructureManager = ProjectStructureManager.getInstance(context);

    // Register tree view
    const treeView = vscode.window.createTreeView('v3c3kFeatures', {
        treeDataProvider: featureTreeProvider,
        showCollapseAll: true
    });

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

    let addFeature = vscode.commands.registerCommand('v3c3k.addFeature', async () => {
        const name = await vscode.window.showInputBox({
            prompt: 'Enter feature name',
            placeHolder: 'Feature name'
        });
        if (!name) return;

        const description = await vscode.window.showInputBox({
            prompt: 'Enter feature description',
            placeHolder: 'Feature description'
        });
        if (!description) return;

        try {
            await execAsync(`v3c3k add "${name}" "${description}"`);
            featureTreeProvider.refresh();
            vscode.window.showInformationMessage(`Feature "${name}" added successfully`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to add feature');
        }
    });

    let refreshFeatures = vscode.commands.registerCommand('v3c3k.refreshFeatures', () => {
        featureTreeProvider.refresh();
    });

    let viewFeature = vscode.commands.registerCommand('v3c3k.viewFeature', async (item: FeatureTreeItem) => {
        try {
            const { stdout } = await execAsync(`v3c3k view "${item.label}"`);
            const feature = JSON.parse(stdout);
            
            const panel = vscode.window.createWebviewPanel(
                'featureDetails',
                `Feature: ${feature.name}`,
                vscode.ViewColumn.One,
                {}
            );

            panel.webview.html = getFeatureDetailsHtml(feature);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to view feature details');
        }
    });

    let validateStructure = vscode.commands.registerCommand('v3c3k.validateStructure', async () => {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        try {
            const result = await projectStructureManager.validateStructure(workspaceRoot);
            StructureValidationPanel.createOrShow(context.extensionUri, result);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to validate project structure');
        }
    });

    let createStructure = vscode.commands.registerCommand('v3c3k.createStructure', async () => {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        try {
            await projectStructureManager.createStructure(workspaceRoot);
            vscode.window.showInformationMessage('Project structure created successfully');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to create project structure');
        }
    });

    let updateStructure = vscode.commands.registerCommand('v3c3k.updateStructure', async () => {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        try {
            const template = await projectStructureManager.getStructureTemplate();
            const document = await vscode.workspace.openTextDocument({
                content: JSON.stringify(template, null, 2),
                language: 'json'
            });
            await vscode.window.showTextDocument(document);

            const saveDisposable = vscode.workspace.onDidSaveTextDocument(async (doc) => {
                if (doc === document) {
                    try {
                        await projectStructureManager.updateStructure(workspaceRoot, JSON.parse(doc.getText()));
                        vscode.window.showInformationMessage('Project structure updated successfully');
                        saveDisposable.dispose();
                    } catch (error) {
                        vscode.window.showErrorMessage('Failed to update project structure');
                    }
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to get structure template');
        }
    });

    context.subscriptions.push(
        checkCLI,
        setApiKey,
        checkApiKey,
        addFeature,
        refreshFeatures,
        treeView,
        validateStructure,
        createStructure,
        updateStructure
    );
}

function getFeatureDetailsHtml(feature: any): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { padding: 20px; font-family: var(--vscode-font-family); }
                h1 { color: var(--vscode-editor-foreground); }
                .detail { margin: 10px 0; }
                .label { font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>${feature.name}</h1>
            <div class="detail">
                <span class="label">Status:</span> ${feature.status}
            </div>
            <div class="detail">
                <span class="label">Description:</span> ${feature.description}
            </div>
            ${feature.dependencies ? `
            <div class="detail">
                <span class="label">Dependencies:</span>
                <ul>
                    ${feature.dependencies.map((dep: string) => `<li>${dep}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </body>
        </html>
    `;
}

export function deactivate() {} 