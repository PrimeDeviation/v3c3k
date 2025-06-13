import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class FeatureTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly status: string,
        public readonly description?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = description;
        this.description = status;
    }

    iconPath = new vscode.ThemeIcon('symbol-feature');
}

export class FeatureTreeProvider implements vscode.TreeDataProvider<FeatureTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FeatureTreeItem | undefined | null | void> = new vscode.EventEmitter<FeatureTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FeatureTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FeatureTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: FeatureTreeItem): Promise<FeatureTreeItem[]> {
        if (element) {
            return [];
        }

        try {
            const { stdout } = await execAsync('v3c3k list');
            const features = JSON.parse(stdout);
            
            return features.map((feature: any) => new FeatureTreeItem(
                feature.name,
                vscode.TreeItemCollapsibleState.None,
                feature.status,
                feature.description
            ));
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch features');
            return [];
        }
    }
} 