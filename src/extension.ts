'use strict';

import * as vscode from 'vscode';
import { TeletypeClient } from '@atom/teletype-client';
import PortalBinding from './PortalBinding';


const fetch = require('node-fetch');
const constants = require('./constants');
const globalAny: any = global;
const wrtc = require('electron-webrtc-patched')();
// const wrtc = require('electron-webrtc')();

globalAny.window = {};
globalAny.window = global;
globalAny.window.fetch = fetch;
globalAny.RTCPeerConnection = wrtc.RTCPeerConnection;

// this method is called when the extension is activated
// the extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Great, your extension "vscode-teletype" is now active!');
	let disposable = vscode.commands.registerCommand('extension.join-portal', async () => {

		
		let auth_token = await vscode.window.showInputBox({ prompt: 'Enter your GitHub AuthToken' });
		if (auth_token){
		let portalIdInput = await getPortalID();
		if (!portalIdInput) {
			
			vscode.window.showInformationMessage("No Portal ID has been entered. Please try again");
		}
		else {
			vscode.window.showInformationMessage('Trying to Join Portal with ID' + ' ' + portalIdInput + ' ');
			await joinPortal(portalIdInput,auth_token);
		}
	}

	});
	context.subscriptions.push(disposable);
}

async function getPortalID() {
	let portalID = await vscode.window.showInputBox({ prompt: 'Enter ID of the Portal you wish to join' });
	return portalID;
}


async function joinPortal(portalId: any,auth_token:any) {
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

		portal_binding = new PortalBinding({ client: client, portalId: portalId, editor: textEditor });
		await portal_binding.initialize();
	}
	else {
		vscode.window.showErrorMessage("GitHub Auth Token. Please provide it in the constants.ts file");
	}
}

export function deactivate() { }
