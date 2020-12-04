'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import { EnterpriseTreeDataProvider, TreeEnterpriseItem } from './enterpriseProvider';
import { EnterpriseService } from './services/enterpriseService';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {    
    
    const enterpriseService = new EnterpriseService(context.globalState);
    const enterpriseProvider = new EnterpriseTreeDataProvider(enterpriseService);
    
    vscode.window.registerTreeDataProvider('STARLIMS', enterpriseProvider);
    vscode.commands.registerCommand('STARLIMS.selectEnterpriseItem', async (item: TreeEnterpriseItem) => {
    
        // open only leaf nodes
        if (item.collapsibleState !== vscode.TreeItemCollapsibleState.None) {
            return;
        }
        
        let result = await enterpriseService.getEntepriseItemCode(item.url, item.type, item.enterpriseId);
        if (result) {
            const wsFolders = vscode.workspace.workspaceFolders;
            let storagePath:string;
            if(!wsFolders) {
                vscode.window.showInformationMessage('Error! You need to have a folder open in your workspace.');
            } else {
                storagePath = wsFolders[0].uri.fsPath;
                storagePath = path.join(storagePath, result.FullPath);

                // open code in new document
                const fileExtension = '.' + (result.Language !== undefined && result.Language !== '' ? result.Language.toLowerCase() : 'txt');
                const newFile = vscode.Uri.file(storagePath + fileExtension);
                const edit = new vscode.WorkspaceEdit();
                edit.createFile(newFile, {ignoreIfExists: true});
                vscode.workspace.applyEdit(edit);
                
                let document = await vscode.workspace.openTextDocument(newFile);
                if(document.getText().length === 0) {
                    enterpriseService.updateFileInfo(storagePath, item.url, item.enterpriseId);
                    
                    edit.insert(newFile, new vscode.Position(0, 0), result.Code);
                    if (! await vscode.workspace.applyEdit(edit)) {
                        vscode.window.showTextDocument(document);
                    } else {
                        vscode.window.showInformationMessage('Error!');
                    }
                } else {
                    var firstLine = document.lineAt(0);
                    var lastLine = document.lineAt(document.lineCount - 1);
                    var textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
                    const edit = new vscode.WorkspaceEdit();
                    edit.replace(newFile, textRange, result.Code);
                    vscode.window.showTextDocument(document);

                    if (! await vscode.workspace.applyEdit(edit)) {
                        vscode.window.showTextDocument(document);
                    } else {
                        vscode.window.showInformationMessage('Error!');
                    }
                }
            }
        }
    });

    vscode.commands.registerCommand('STARLIMS.downloadApp', async (node) => {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: 'Select Folder'
        };

        const result = await vscode.window.showOpenDialog(options);
        if (result ) {
            const path = result[0].path;
            const appManifest = await enterpriseService.getApplicationManifest(node.url, node.enterpriseId);
            console.log(path);
            console.log(appManifest);
            await enterpriseService.downloadApplication(node.url, appManifest, path);
        }
    });

    vscode.commands.registerCommand('STARLIMS.Checkout', async (item: TreeEnterpriseItem) => {
        await enterpriseService.checkout(item.url, item.type, item.enterpriseId);
    });

    vscode.commands.registerCommand('STARLIMS.Checkin', async (item: TreeEnterpriseItem) => {
        let checkinReason : string = await vscode.window.showInputBox( {
            prompt: 'Enter checkin reason',
            ignoreFocusOut: true,
        })||'';
       
        await enterpriseService.checkin(item.url, item.type, item.enterpriseId, checkinReason);
    });

    vscode.commands.registerCommand('STARLIMS.refresh', async (item: TreeEnterpriseItem) => {
        await enterpriseProvider.refresh();
    });

    vscode.commands.registerCommand('STARLIMS.save', async (item: TreeEnterpriseItem) => {
        let activeEditor : any = vscode.window.activeTextEditor;
        if(activeEditor !== undefined) {
            let sFileName : any = activeEditor.document.fileName;
            let sCode : any = activeEditor.document.getText();
            sFileName = path.basename(sFileName);
            sFileName = sFileName.substr(0, sFileName.lastIndexOf('.'));
            await enterpriseService.save(item.url, sFileName, sCode);
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}