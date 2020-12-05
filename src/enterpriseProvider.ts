import * as vscode from 'vscode';
import {EnterpriseService, EnterpriseItemType, STARLIMSInstall} from './services/enterpriseService';

export class EnterpriseTreeDataProvider implements vscode.TreeDataProvider<TreeEnterpriseItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<TreeEnterpriseItem | null> = new vscode.EventEmitter<TreeEnterpriseItem | null>();
    readonly onDidChangeTreeData: vscode.Event<TreeEnterpriseItem | null> = this._onDidChangeTreeData.event;

    
    private service : EnterpriseService;

	constructor(enterpriseService : EnterpriseService) {
		this.service = enterpriseService;
    }

    refresh(): void {
		this._onDidChangeTreeData.fire();
    }

    public async getChildren(element?: TreeEnterpriseItem): Promise<TreeEnterpriseItem[]> {
        const enterpriseTreeItems: TreeEnterpriseItem[] = [];
        let config: Map<string, STARLIMSInstall> = await this.service.getInstallationConfigs();
        
        if(!element) {
            config.forEach(install => {
                const itemType: EnterpriseItemType = EnterpriseItemType.Server;
                const itemId: string = install.url;
                const parentId: string = '';
                const label : string = install.url;
                const collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                const url : string = install.url;
                const enterpriseItem : TreeEnterpriseItem = new TreeEnterpriseItem(itemType, label, itemId, parentId, collapsibleState, url, "");
                enterpriseItem.command = {
                    command: 'STARLIMS.selectEnterpriseItem',
                    title: 'Select Node',
                    arguments: [enterpriseItem]
                };
                enterpriseItem.contextValue = itemType;
                enterpriseTreeItems.push(enterpriseItem);
            });
            
        }
        else {
            const bTopLevel = element.type === EnterpriseItemType.Server;
            const itemType: EnterpriseItemType = !bTopLevel ? element.type : EnterpriseItemType.EnterpriseCategory;
            const itemId: string = !bTopLevel ? element.enterpriseId : '';
            const parentId: string = !bTopLevel ? element.parentEnterpriseId : '';
            const url : string = element.url;

            const enterpriseItems : any [] = await this.service.getEnterpriseItem(url, itemType, itemId, parentId);

            enterpriseItems.forEach((item: any) => {
                const enterpriseTreeItem = new TreeEnterpriseItem(item.Type, item.Name, item.ID, item.ParentID,
                    item.IsFolder ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
                    element.url, item.CheckedOutBy);
                enterpriseTreeItem.command = {
                    command: 'STARLIMS.selectEnterpriseItem',
                    title: 'Select Node',
                    arguments: [enterpriseTreeItem],
                };
                enterpriseTreeItem.contextValue = item.Type;
                enterpriseTreeItem.iconPath = item.IsFolder ? vscode.ThemeIcon.Folder : vscode.ThemeIcon.File;
                enterpriseTreeItems.push(enterpriseTreeItem);
            });
        }
        
        
        return enterpriseTreeItems;
    }

    getTreeItem(item: TreeEnterpriseItem): vscode.TreeItem {
		return item;
    }
}

export class TreeEnterpriseItem extends vscode.TreeItem {

    type: EnterpriseItemType;
    enterpriseId: string;
    parentEnterpriseId : string;
    url: string;
    checkedOutBy: string;

    constructor(
        type: EnterpriseItemType,
        label: string,
        id: string,
        parentId: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        url: string,
        checkedOutBy: string
    ) {
        if(checkedOutBy) {
            label += ` (${checkedOutBy})`;
        }
        super(label, collapsibleState);
        this.type = type;
        this.enterpriseId = id;
        this.parentEnterpriseId = parentId;
        this.url = url;
        this.checkedOutBy = checkedOutBy;
    }
}

