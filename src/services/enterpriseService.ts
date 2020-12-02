import * as request from 'request-promise'; 
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


export class EnterpriseService {
    public async save(url: string, itemID: string, code: string) {
        let result : any = null;
        const config : STARLIMSInstall|null = await this.getInstallationConfig(url);
        
        if(config) {
            const options: any = {
                method: 'POST',
                headers: {
                    'STARLIMSUser': config.user,
                    'STARLIMSPass': config.pw
                },
                qs: {
                    'ItemId': itemID
                },
                body: code
            };

            try {
                result = await request(config.url  + '/SCM_API.SaveCode.lims', options);
                vscode.window.showErrorMessage(result);
            } catch (e) {
                console.error(e);
                vscode.window.showErrorMessage(e.error);
            }
        }

        return result;
    }
    
    public async checkin(url: string, itemType: string, itemID: string, reason: string) {
        let result : any = null;
        const config : STARLIMSInstall|null = await this.getInstallationConfig(url);
        
        if(config) {
        const options: any = {
                method: 'GET',
                headers: {
                    'STARLIMSUser': config.user,
                    'STARLIMSPass': config.pw
                },
                qs: {
                    'ItemId': itemID,
                    'FileType': itemType,
                    'Reason': reason
                },
                json: true
            };

            try {
                result = await request(config.url  + '/SCM_API.Checkin.lims', options);
            } catch (e) {
                console.error(e);
                vscode.window.showErrorMessage(e.error);
            }
        }
        return result;
    }

    public async checkout(url: string, itemType: string, itemID: string) {
        let result : any = null;
        const config : STARLIMSInstall|null = await this.getInstallationConfig(url);
        
        if(config) 
        {
            const options: any = {
                method: 'GET',
                headers: {
                    'STARLIMSUser': config.user,
                    'STARLIMSPass': config.pw
                },
                qs: {
                    'ItemId': itemID,
                    'FileType': itemType
                },
                json: true
            };

            try {
                result = await request(config.url  + '/SCM_API.Checkout.lims', options);
            } catch (e) {
                console.error(e);
                vscode.window.showErrorMessage(e.error);
            }
        }

        return result;
    }
    
    private config: Map<string, STARLIMSInstall>;
    private globalState : vscode.Memento;
    
    constructor (globalState : vscode.Memento) {
        const config = vscode.workspace.getConfiguration("STARLIMS");
        const installations: object[] | undefined = config.get('installations');
        this.config = new Map<string, STARLIMSInstall>();
        this.globalState = globalState;
        if(installations) {
            installations.forEach((item:any) => {
                this.config.set(item.url, new STARLIMSInstall(item.url, item.name, item.user, null));
            });
        }

        if(!globalState.get("oFileInfo")) {
            globalState.update("oFileInfo", {});
        }
    }

    public async updateFileInfo(path:string, url:string, id:string) : Promise<void> {
        const oFileInfo :any = this.globalState.get("oFileInfo");
        oFileInfo[path] = {'url':url, 'id':id};
        this.globalState.update('oFileInfo', oFileInfo);
    }

    private async getFileInfo(path:string) : Promise<any> {
        return this.globalState.get<any>("oFileInfo")[path];
    }

    private async getInstallationConfig(url:string) : Promise<STARLIMSInstall | null>{
        const install : STARLIMSInstall|undefined = this.config.get(url);
        if(!install) { 
            return null;
        }
        else {
            if(!install.user) {
                install.user = await vscode.window.showInputBox({
                    prompt: `Enter user for installation '${url}'`,
                    password: false,
                    ignoreFocusOut: true
                })||null;
            } 

            if(!install.pw) {
                install.pw = await vscode.window.showInputBox({
                    prompt: `Enter password for installation '${url}'`,
                    password: true,
                    ignoreFocusOut: true
                })||null;
            } 
        }

        return install;
    }

    public async getEnterpriseItem(url: string, itemType: string, itemID: string, parentID: string) {
        const config : STARLIMSInstall|null = await this.getInstallationConfig(url);

        let result : any = null;
        if(config) {
            const options: any = {
                method: 'GET',
                headers: {
                    'STARLIMSUser': config.user,
                    'STARLIMSPass': config.pw
                },
                qs: {
                    'ItemType': itemType,
                    'ItemID': itemID,
                    'ParentID': parentID
                },
                json: true
            };

            try {
                result = await request(url  + '/SCM_API.GetEnterpriseItems.lims', options);
            } catch (e) {
                console.error(e);
                vscode.window.showErrorMessage(e.error);
            }
        }
        return result;
    }

    public async getEntepriseItemCode(url: string, itemType: string, itemID: string) {
        let result : any = null;
        const config : STARLIMSInstall|null = await this.getInstallationConfig(url);

        if(config) {
            const options: any = {
                method: 'GET',
                headers: {
                    'STARLIMSUser': config.user,
                    'STARLIMSPass': config.pw
                },
                qs: {
                    'ItemType': itemType,
                    'ItemID': itemID
                },
                json: true
            };

            try {
                result = await request(url  + '/SCM_API.GetCode.lims', options);

            } catch (e) {
                console.error(e);
                vscode.window.showErrorMessage(e.error);
            }

            return result;
        }    
    }

    public async getApplicationManifest(url:string, appID: string) {
        let result : any = null;
        const config : STARLIMSInstall|null = await this.getInstallationConfig(url);

        if(config) {
            const options: any = {
                method: 'GET',
                headers: {
                    'STARLIMSUser': config.user,
                    'STARLIMSPass': config.pw
                },
                qs: {
                    'AppID': appID
                },
                json: true
            };

            try {
                result = await request(config.url  + '/SCM_API.GetAppManifest.lims', options);
            } catch (e) {
                console.error(e);
                vscode.window.showErrorMessage(e.error);
            }
        }
        return result;
    }

    public async downloadApplication(url:string, app: any, folder: string) {
        // create a folder for the app
        let appFolder = path.join(folder, app.CategoryName, app.AppName);
        appFolder = appFolder.substring(1, appFolder.length);
        //let appFolder = folder.substring(1, 4);
        
        // for some reson fs.mkdir did not work when called from VS ext...       
        const mkdirp = require('async-mkdirp');
        
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Downloading application ${app.AppName}`,
            cancellable: true
        }, async (progress, token) => {

            progress.report({increment: 0, message: 'Creating local folders. Downloading application...'});

            setTimeout(() => {
				progress.report({ increment: 10, message: "Downloading application server scripts..." });
            }, 1000);

            
            await mkdirp(appFolder);   
            let ssFolder = path.join(appFolder, 'Server Scripts');
            await mkdirp(ssFolder);
            let dsFolder = path.join(appFolder, 'Data Sources');
            await mkdirp(dsFolder);
            let csFolder = path.join(appFolder, 'Client Scripts');
            await mkdirp(csFolder);
            let xfdFormsFolder = path.join(appFolder, 'XFD Forms');
            await mkdirp(xfdFormsFolder);
            let htmlFormsFolder = path.join(appFolder, 'HTML Forms');
            await mkdirp(htmlFormsFolder);

            app.ServerScripts.forEach(async (ss: any) => {
                let ssCode = await this.getEntepriseItemCode(url, EnterpriseItemType.AppServerScript, ss.ScriptID);
                let fileName = ss.ScriptName + (ss.Language === "STARLIMS" ? ".ssl" : ".txt");
                try {
                    await fs.writeFileSync(path.join(ssFolder, fileName), ssCode.Code, {encoding: 'utf8'});
                } catch(e) {
                    console.error(e);
                }
            });

            progress.report({ increment: 30, message: "Downloading application data sources..." });

            app.DataSources.forEach(async (ds: any) => {
                let dsCode = await this.getEntepriseItemCode(url, EnterpriseItemType.AppDataSource, ds.ScriptID);
                let fileName = ds.ScriptName + (ds.Language === "STARLIMS" ? ".ssl" : ".sql");
                try {
                    await fs.writeFileSync(path.join(dsFolder, fileName), dsCode.Code, {encoding: 'utf8'});
                } catch(e) {
                    console.error(e);
                }
            });

            progress.report({ increment: 50, message: "Downloading application client scripts..." });

            app.ClientScripts.forEach(async (cs: any) => {
                let csCode = await this.getEntepriseItemCode(url, EnterpriseItemType.AppClientScript, cs.ScriptID);
                let fileName = cs.ScriptName + (cs.Language === "JSCRIPT" ? ".js" : ".txt");
                try {
                    await fs.writeFileSync(path.join(csFolder, fileName), csCode.Code, {encoding: 'utf8'});
                } catch(e) {
                    console.error(e);
                }
            });

            progress.report({ increment: 70, message: "Downloading application XFD forms..." });

            app.XFDForms.forEach(async (frm: any) => {
                let frmCodeBehind = await this.getEntepriseItemCode(url, EnterpriseItemType.XFDFormCode, frm.FormID);
                let codeBehindFileName = frm.FormName + '.js';
                let frmXML = await this.getEntepriseItemCode(url, EnterpriseItemType.XFDFormXML, frm.FormID);
                let xmlFileName = frm.FormName + '.xml';
                try {
                    await fs.writeFileSync(path.join(xfdFormsFolder, codeBehindFileName), frmCodeBehind.Code, {encoding: 'utf8'});
                    await fs.writeFileSync(path.join(xfdFormsFolder, xmlFileName), frmXML.Code, {encoding: 'utf8'});
                } catch(e) {
                    console.error(e);
                }
            });

            progress.report({ increment: 90, message: "Downloading application HTML forms..." });

            app.HTMLForms.forEach(async (frm: any) => {
                let frmCodeBehind = await this.getEntepriseItemCode(url, EnterpriseItemType.HTMLFormCode, frm.FormID);
                let codeBehindFileName = frm.FormName + '.js';
                let frmXML = await this.getEntepriseItemCode(url, EnterpriseItemType.HTMLFormXML, frm.FormID);
                let xmlFileName = frm.FormName + '.xml';
                try {
                    await fs.writeFileSync(path.join(htmlFormsFolder, codeBehindFileName), frmCodeBehind.Code, {encoding: 'utf8'});
                    await fs.writeFileSync(path.join(htmlFormsFolder, xmlFileName), frmXML.Code, {encoding: 'utf8'});
                } catch(e) {
                    console.error(e);
                }
            });

            progress.report({ increment: 100, message: "Done." });
            vscode.window.showInformationMessage(`Downloaded app in ${appFolder}`);
        });
    }
}


export enum EnterpriseItemType {
    Server = "SERVER",
    EnterpriseCategory = "CATEGORY",
    AppCategory = "APPCATEGORY",
    Application = "APP",
    XFDFormXML = "XFDFORMXML",
    XFDFormCode = "XFDFORMCODE",
    HTMLFormXML = "HTMLFORMXML",
    HTMLFormCode = "HTMLFORMCODE",
    PhoneForm = "PHONEFORM",
    TabletForm = "TABLETFORM",
    AppServerScript = "APPSS",
    AppClientScript = "APPCS",
    AppDataSource = "APPDS",
    ServerScriptCategory = "SSCAT",
    ServerScript = "SS",
    ClientScriptCategory = "CSCAT",
    DataSource = "DS",
    DataSourceCategory = "DSCAT"
}

export class STARLIMSInstall {
    url: string;
    name: string;
    user: string|null;
    pw: string|null;

    constructor(url:string, name:string, user:string|null, pw:string|null) {
        this.url = url;
        this.name = name;
        this.user = user;
        this.pw = pw;
    }
}