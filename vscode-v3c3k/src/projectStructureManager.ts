import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export interface StructureValidationResult {
    isValid: boolean;
    issues: StructureIssue[];
}

export interface StructureIssue {
    type: 'error' | 'warning';
    message: string;
    path: string;
}

export class ProjectStructureManager {
    private static instance: ProjectStructureManager;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): ProjectStructureManager {
        if (!ProjectStructureManager.instance) {
            ProjectStructureManager.instance = new ProjectStructureManager(context);
        }
        return ProjectStructureManager.instance;
    }

    public async validateStructure(workspaceRoot: string): Promise<StructureValidationResult> {
        try {
            const { stdout } = await execAsync('v3c3k validate-structure', { cwd: workspaceRoot });
            return JSON.parse(stdout);
        } catch (error) {
            return {
                isValid: false,
                issues: [{
                    type: 'error',
                    message: 'Failed to validate project structure',
                    path: workspaceRoot
                }]
            };
        }
    }

    public async createStructure(workspaceRoot: string): Promise<void> {
        try {
            await execAsync('v3c3k create-structure', { cwd: workspaceRoot });
        } catch (error) {
            throw new Error('Failed to create project structure');
        }
    }

    public async getStructureTemplate(): Promise<any> {
        try {
            const { stdout } = await execAsync('v3c3k get-structure-template');
            return JSON.parse(stdout);
        } catch (error) {
            throw new Error('Failed to get structure template');
        }
    }

    public async updateStructure(workspaceRoot: string, template: any): Promise<void> {
        try {
            const templatePath = path.join(workspaceRoot, '.v3c3k', 'structure-template.json');
            await vscode.workspace.fs.writeFile(
                vscode.Uri.file(templatePath),
                Buffer.from(JSON.stringify(template, null, 2))
            );
            await execAsync('v3c3k update-structure', { cwd: workspaceRoot });
        } catch (error) {
            throw new Error('Failed to update project structure');
        }
    }
} 