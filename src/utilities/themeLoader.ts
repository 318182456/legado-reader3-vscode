import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function getLocalThemes(extensionUri: vscode.Uri, webview: vscode.Webview): any[] {
    const themesDir = vscode.Uri.joinPath(extensionUri, 'public', 'themes').fsPath;
    const themes: any[] = [];
    if (fs.existsSync(themesDir)) {
        try {
            const folders = fs.readdirSync(themesDir);
            for (const folder of folders) {
                const folderPath = path.join(themesDir, folder);
                if (!fs.statSync(folderPath).isDirectory()) {
                    continue;
                }
                const configPath = path.join(folderPath, 'readConfig.json');
                if (fs.existsSync(configPath)) {
                    try {
                        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                        let bgStr = config.bgStr || '';
                        if (bgStr && !bgStr.startsWith('#')) {
                            let bgPath = path.join(folderPath, bgStr);
                            if (!fs.existsSync(bgPath)) {
                                const ext = path.extname(bgPath);
                                const base = bgPath.slice(0, -ext.length);
                                for (const alt of ['.jpg', '.jpeg', '.png', '.webp']) {
                                    if (fs.existsSync(base + alt)) {
                                        bgPath = base + alt;
                                        break;
                                    }
                                }
                            }
                            const bgUri = vscode.Uri.file(bgPath);
                            bgStr = `url("${webview.asWebviewUri(bgUri).toString()}")`;
                        }
                        let textFont = config.textFont || '';
                        let fontUrl = '';
                        let fontFamily = '';
                        if (textFont) {
                            let fontUri;
                            if (path.isAbsolute(textFont)) {
                                fontUri = vscode.Uri.file(textFont);
                            } else {
                                fontUri = vscode.Uri.file(path.resolve(folderPath, textFont));
                            }
                            fontUrl = webview.asWebviewUri(fontUri).toString();
                            const fontName = path.basename(textFont, path.extname(textFont));
                            fontFamily = `Font_${fontName.replace(/\s+/g, '_')}`;
                        }
                        
                        themes.push({
                            name: config.name || folder,
                            body: `${bgStr} repeat`,
                            content: `${bgStr} repeat`,
                            popup: `${bgStr} repeat`,
                            isNight: config.darkStatusIcon === false,
                            defaultFontColor: config.darkStatusIcon === false ? "#f8f8f2" : "#262626",
                            fontFamily: fontFamily,
                            fontUrl: fontUrl
                        });
                    } catch (e) {
                        console.error("Failed to parse theme config:", configPath, e);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to read themes directory:", themesDir, e);
        }
    }
    return themes;
}
