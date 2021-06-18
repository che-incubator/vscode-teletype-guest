'use strict';

import * as vscode from 'vscode';
import { TeletypeClient } from '@atom/teletype-client';
import PortalBinding from './PortalBinding';

const fetch = require('node-fetch');
const constants = require('./constants');
const globalAny: any = global;
// const wrtc = require('electron-webrtc-patched')();
const wrtc = require('wrtc');

globalAny.window = {};
globalAny.window = global;
globalAny.window.fetch = fetch;
globalAny.RTCPeerConnection = wrtc.RTCPeerConnection;

// this method is called when the extension is activated
// the extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('extension.join-portal', async () => {
		if (!context.globalState.get('authToken')) {
			const authTokenInput = await vscode.window.showInputBox({
				prompt: 'Enter your GitHub AuthToken',
				password: true,
				ignoreFocusOut: true,
			});

			if (authTokenInput) {
				context.globalState.update('authToken', authTokenInput);
			}
		}

		if (context.globalState.get('authToken')) {
			let portalIdInput = await vscode.window.showInputBox({
				prompt: 'Enter ID of the Portal you wish to join',
				ignoreFocusOut: true,
				value: context.globalState.get('portalId'),
			});

			if (portalIdInput) {
				portalIdInput = portalIdInput.replace("atom://teletype/portal/", "");
				context.globalState.update('portalId', portalIdInput);
				vscode.window.showInformationMessage(`Trying to Join Portal with ID ${portalIdInput}`);
				TeletypeCodingPanel.createOrShow(context);
			} else {
				vscode.window.showInformationMessage('No Portal ID has been entered. Please try again');
			}
		}
	});

	context.subscriptions.push(disposable);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(TeletypeCodingPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				TeletypeCodingPanel.revive(webviewPanel, context);
			}
		});
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [
			(vscode.Uri as any).joinPath(extensionUri, 'out'),
			(vscode.Uri as any).joinPath(extensionUri, 'media'),
		],
	};
}

/**
 * Manages cat coding webview panels
 */
class TeletypeCodingPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: TeletypeCodingPanel | undefined;

	public static readonly viewType = 'teletypeCoding';

	private readonly _context: vscode.ExtensionContext;
	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(context: vscode.ExtensionContext) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (TeletypeCodingPanel.currentPanel) {
			TeletypeCodingPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			TeletypeCodingPanel.viewType,
			'Teletype Coding',
			column || vscode.ViewColumn.One,
			getWebviewOptions(context.extensionUri),
		);

		TeletypeCodingPanel.currentPanel = new TeletypeCodingPanel(panel, context);

		TeletypeCodingPanel.currentPanel.init();
	}

	public static revive(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
		TeletypeCodingPanel.currentPanel = new TeletypeCodingPanel(panel, context);

		TeletypeCodingPanel.currentPanel.init();
	}

	private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
		this._panel = panel;
		this._context = context;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			(e) => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			(message) => {
				switch (message.command) {
					case 'open-editor':
						//
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public init() {
		this._panel.webview.postMessage({
			command: 'init',
			data: {
				endpoint: constants.API_URL_BASE,
				authToken: this._context.globalState.get('authToken') as string,
				portalId: this._context.globalState.get('portalId') as string,
				pusher: {
					key: constants.PUSHER_KEY,
					cluster: constants.PUSHER_CLUSTER,
				},
			},
		});
	}

	public dispose() {
		TeletypeCodingPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		this._panel.title = 'Teletype Client';
		this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Local path to main script run in the webview
		const scriptPathOnDisk = (vscode.Uri as any).joinPath(this._context.extensionUri, 'media', 'main.js');
		const teletypeScriptPathOnDisk = (vscode.Uri as any).joinPath(this._context.extensionUri, 'media', 'cheteletype.js');

		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
		const teletypeScriptUri = webview.asWebviewUri(teletypeScriptPathOnDisk);

		// Local path to css styles
		const styleResetPath = (vscode.Uri as any).joinPath(this._context.extensionUri, 'media', 'reset.css');
		const stylesPathMainPath = (vscode.Uri as any).joinPath(this._context.extensionUri, 'media', 'vscode.css');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src https: wss:; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src ${webview.cspSource} 'unsafe-eval' 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>Teletype Coding</title>
			</head>
			<body>
				<h1>Teletype Client Panel</h1>

				<script nonce="${nonce}" src="${teletypeScriptUri}"></script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

async function joinPortal(portalId: any, auth_token: any) {
	console.log('Inside the function call of JoinPortal');

	let textEditor = vscode.window.activeTextEditor;
	let client, portal_binding;
	if (auth_token !== '') {
		try {
			client = new TeletypeClient({
				pusherKey: constants.PUSHER_KEY,
				pusherOptions: {
					cluster: constants.PUSHER_CLUSTER
				},
				baseURL: constants.API_URL_BASE,
			}
			);

			await client.initialize();
			// await client.signIn(constants.AUTH_TOKEN);
			await client.signIn(auth_token);

			console.log('Inside the try block of creating teletype client');




		} catch (e) {
			console.log('Inside the catch block of creating teletype client');

			console.log("Exception Error Message " + e);
		}

		// portal_binding = new PortalBinding({ client: client, portalId: portalId, editor: textEditor });
		// await portal_binding.initialize();
	}
	else {
		vscode.window.showErrorMessage("GitHub Auth Token. Please provide it in the constants.ts file");
	}
}

export function deactivate() { }
