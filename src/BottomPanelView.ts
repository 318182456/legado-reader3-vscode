import * as vscode from 'vscode';
import { getUri } from "./utilities/getUri";

export class BottomPanelView implements vscode.WebviewViewProvider {
  public static readonly viewId = 'legado-reader3-vscode.bottomView';
  public static instance: BottomPanelView | undefined;
  
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {
    BottomPanelView.instance = this;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    const customTitle = vscode.workspace.getConfiguration().get("legado-reader3-vscode.bottomPanelTitle") || "阅读终端";
    this._view.title = customTitle as string;

    webviewView.webview.options = { 
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this._extensionUri, "out"),
          vscode.Uri.joinPath(this._extensionUri, "web", "dist")
        ]
    };

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(this._messageListener.bind(this));

    this._update();
  }

  private _messageListener(message: any) {
    switch (message.command) {
      case "alert":
        vscode.window.showErrorMessage(message.text);
        return;
      case "setConfiguration":
        vscode.workspace
          .getConfiguration()
          .update(message.key, message.value, vscode.ConfigurationTarget.Global);
        return;
      case "reload":
        this._update();
        return;
      case "printToConsole":
        // Do nothing in this mode since UI is fully interactive
        return;
    }
  }

  public updateContent(content: string) {
      // Stub to avoid breaking existing calls
  }

  private _update() {
    if (this._view) {
        this._view.webview.html = this._getHtmlForWebview(this._view.webview);
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const baseUri = getUri(webview, this._extensionUri, ["web", "dist"]).toString();
    let webServeUrl: string =
      vscode.workspace.getConfiguration().get("legado-reader3-vscode.webServeUrl") || "";
    webServeUrl = webServeUrl.replace(/^\s+|[\/\s]+$/, "");

    return /*html*/ `
      <!DOCTYPE html>
      <html lang="zh" class="">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" href="${baseUri}/favicon.ico" />
          <meta name="viewport" content="width=device-width,initial-scale=1.0" />
          <script type="text/javascript">
            localStorage.setItem("legadoWebServeUrl", "${webServeUrl}");
          </script>
          <script type="module" crossorigin src="${baseUri}/assets/index.js"></script>
          <link rel="modulepreload" crossorigin href="${baseUri}/assets/vendor.js">
          <link rel="stylesheet" href="${baseUri}/assets/vendor.css">
          <link rel="stylesheet" href="${baseUri}/assets/index.css">
        </head>
        <body>
          <div id="app"></div>
        </body>
      </html>
    `;
  }
}
