import * as vscode from 'vscode';

export class ApiKeyManager {
    private static instance: ApiKeyManager;
    private context: vscode.ExtensionContext;

    private constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(context: vscode.ExtensionContext): ApiKeyManager {
        if (!ApiKeyManager.instance) {
            ApiKeyManager.instance = new ApiKeyManager(context);
        }
        return ApiKeyManager.instance;
    }

    public async setApiKey(model: string, key: string): Promise<void> {
        await this.context.secrets.store(`v3c3k.apiKey.${model}`, key);
    }

    public async getApiKey(model: string): Promise<string | undefined> {
        return await this.context.secrets.get(`v3c3k.apiKey.${model}`);
    }

    public async hasApiKey(model: string): Promise<boolean> {
        const key = await this.getApiKey(model);
        return key !== undefined;
    }

    public async deleteApiKey(model: string): Promise<void> {
        await this.context.secrets.delete(`v3c3k.apiKey.${model}`);
    }
} 