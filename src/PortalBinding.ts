const assert = require('assert');
import * as vscode from 'vscode';
import { TeletypeClient, Errors, Portal, FollowState, EditorProxy, BufferProxy } from '@atom/teletype-client';
import BufferBinding from './BufferBinding';
import EditorBinding from './EditorBinding';

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export default class PortalBinding {
	public client: TeletypeClient;
	private readonly portalId: string;
	private readonly editor: vscode.TextEditor;
	private portal!: Portal;
	private tetherState: any;
	private tetherEditorProxy: any;
	private disposed!: boolean;
	private lastEditorProxyChangePromise : Promise<void>;
	private onAddEditorProxy: any;
	private onRemoveEditorProxy: any;
	private joinEvents: any;
	private editorBindingsByEditorProxy : Map<EditorProxy, EditorBinding>;
	private bufferBindingsByBufferProxy : Map<BufferProxy, BufferBinding>;
	private bufferBindingsByBuffer : Map<vscode.TextDocument, BufferBinding>;
	private editorBindingsByEditor : Map<vscode.TextEditor, EditorBinding>;
	private editorProxiesByEditor : WeakMap<vscode.TextEditor, EditorProxy>;
	private hostClosedPortal = false;
	private hostLostConnection = false;
    private leaveEvents = [];
    private editorProxies = new Set();
    private tetherEditorProxyChangeCounter: any;
    private tetherPosition = null;
    private activePositionsBySiteId = {};


	constructor({ client, portalId, editor }: { client: any; portalId: any; editor: any; }) {
		this.client = client;
		this.portalId = portalId;
		this.editor = editor;
		this.lastEditorProxyChangePromise = Promise.resolve();
		this.editorBindingsByEditorProxy = new Map();
		this.bufferBindingsByBufferProxy = new Map();
		this.bufferBindingsByBuffer = new Map();
		this.editorBindingsByEditor = new Map();
		this.editorProxiesByEditor = new WeakMap();
		this.tetherEditorProxyChangeCounter = 0;
		
	}

	async initialize() {
		try {
			console.log('Inside the try block of setting delegate');

			if (this.client !== undefined){
				console.log('This client is not undefined');
			}

			if (this.editor !== undefined){
				console.log('This editor is not undefined');
			}

			if (this.portalId !== undefined){
				console.log('This portalId is not undefined' + this.portalId);
			}

			this.portal = await this.client.joinPortal(this.portalId);
			this.portal.setDelegate(this);
			vscode.window.showInformationMessage('Joined Portal with ID' + ' ' + this.portalId + ' ');			
			this.registerWorkspaceEvents();
		} 
		catch (Error) {
			console.log('Inside the catch block of setting delegate');
			console.log(Error.message);
			console.log('After error message');
			vscode.window.showErrorMessage('Unable to join the Portal with ID' + ' ' + this.portalId + ' ');
		}
	}

	private registerWorkspaceEvents () {
		vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument.bind(this));
		vscode.workspace.onWillSaveTextDocument(this.saveDocument.bind(this));
		vscode.window.onDidChangeTextEditorSelection(this.triggerSelectionChanges.bind(this));
	}

	private onDidChangeTextDocument (event : vscode.TextDocumentChangeEvent) {
		if(this.bufferBindingsByBuffer){
		const bufferBinding = this.bufferBindingsByBuffer.get(event.document);
		if (bufferBinding) {
			bufferBinding.onDidChangeBuffer(event.contentChanges);
		}
	}
	}

	private saveDocument (event : vscode.TextDocumentWillSaveEvent) {
		if(this.bufferBindingsByBuffer){
		const bufferBinding = this.bufferBindingsByBuffer.get(event.document);
		if (bufferBinding) {
			event.waitUntil(bufferBinding.requestSavePromise());
		}
	}
}

	private triggerSelectionChanges(event : vscode.TextEditorSelectionChangeEvent) {
		const editorBinding = this.editorBindingsByEditor.get(event.textEditor);
		if (editorBinding) {
			editorBinding.updateSelections(event.selections);
		}
	}

	dispose() {
		this.disposed = true;
	}

	isDisposed() {
		return this.disposed;
	}

	hostDidClosePortal() {
		this.hostClosedPortal = true;
	}

	hasHostClosedPortal() {
		return this.hostClosedPortal;
	}

	hostDidLoseConnection() {
		this.hostLostConnection = true;
	}

	hasHostLostConnection() {
		return this.hostLostConnection;
	}

	addEditorProxy(editorProxy: any) {
		if(editorProxy && this.editorProxies){
		if (typeof this.onAddEditorProxy === "function") {
			this.onAddEditorProxy(editorProxy);
		}
		console.log("addEditorProxy: " + editorProxy.bufferProxy.uri);
		if (!this.editorProxies.has(editorProxy)) {
			console.log('Cannot add the same editor proxy multiple times remove/add again');
			this.editorProxies.delete(editorProxy);
		}

		this.editorProxies.add(editorProxy);
	}
}

	removeEditorProxy(editorProxy: any) {
		if (typeof this.onRemoveEditorProxy === "function") {
			this.onRemoveEditorProxy(editorProxy);
		}
		assert(this.editorProxies.has(editorProxy), 'Can only remove editor proxies that had previously been added');
		this.editorProxies.delete(editorProxy);
		if (this.tetherEditorProxy === editorProxy) {
			this.tetherEditorProxy = null;
			this.tetherEditorProxyChangeCounter++;
		}
	}

	editorProxyForURI(uri: any) {
		return Array.from(this.editorProxies).find((e: any) => e.bufferProxy.uri === uri);
	}

	getTetherEditorProxy() {
		return this.tetherEditorProxy;
	}

	getTetherBufferProxyURI() {
		return (this.tetherEditorProxy) ? this.tetherEditorProxy.bufferProxy.uri : null;
	}

	getEditorProxies() {
		return Array.from(this.editorProxies);
	}

	async updateTether(state: any, editorProxy: any, position: any) {
		
		if (editorProxy) {
			this.lastEditorProxyChangePromise = this.lastEditorProxyChangePromise.then(() =>
				this.onUpdateTether(state, editorProxy, position)
			);
		}
		console.log("updateTether: " + editorProxy.bufferProxy.uri);
		this.addEditorProxy(editorProxy);
		this.tetherState = state;
		if (editorProxy !== this.tetherEditorProxy) {
			this.tetherEditorProxy = editorProxy;
			this.tetherEditorProxyChangeCounter++;
		}
		this.tetherPosition = position;
	}
	
	
	
	private async onUpdateTether (state:any, editorProxy:any, position:any) {
		if (state === FollowState.RETRACTED) {
			const editor = await this.findOrCreateEditorByEditorProxy(editorProxy);
		} else {
			this.editorBindingsByEditorProxy.forEach((editor_binding:any) => editor_binding.updateTether(state, undefined));
		}

		const editorBinding = this.editorBindingsByEditorProxy.get(editorProxy);
		if (editorBinding && position) {
			editorBinding.updateTether(state, position);
		}
	}

	private async findOrCreateEditorByEditorProxy (editorProxy:any) : Promise<vscode.TextEditor> {
		let editor : vscode.TextEditor;
		let editorBinding = this.editorBindingsByEditorProxy.get(editorProxy);
		if (editorBinding) {
			editor = editorBinding.editor;
		} else {
			const {bufferProxy} = editorProxy;
			const buffer = await this.findOrCreateBufferForBufferProxy(bufferProxy);
			const bufferBinding = this.bufferBindingsByBufferProxy.get(bufferProxy);
			await vscode.workspace.openTextDocument(buffer.uri);

			console.log('find buffer, now show it');
			editor = await vscode.window.showTextDocument(buffer);
			editorBinding = new EditorBinding({
				editor,
				portal: this.portal,
				isHost: false
			});
			await vscode.commands.executeCommand('workbench.action.keepEditor');
			if (bufferBinding){
				bufferBinding.setEditor(editor);
			}
			

			editorBinding.setEditorProxy(editorProxy);
			editorProxy.setDelegate(editorBinding);

			this.editorBindingsByEditorProxy.set(editorProxy, editorBinding);
			this.editorProxiesByEditor.set(editor, editorProxy);
			this.editorBindingsByEditor.set(editor, editorBinding);

			editorBinding.onDidDispose(() => {
				this.editorProxiesByEditor.delete(editor);
				this.editorBindingsByEditorProxy.delete(editorProxy);
			});
		}
		return editor;
	}

	private async findOrCreateBufferForBufferProxy (bufferProxy:any) : Promise<vscode.TextDocument> {
		let buffer : vscode.TextDocument;
		let bufferBinding = this.bufferBindingsByBufferProxy.get(bufferProxy);
		if (bufferBinding) {
			buffer = bufferBinding.buffer;
		} else {
			const bufferURI = vscode.Uri.parse(`file://${path.join(os.tmpdir(), `/${this.portalId}/`, bufferProxy.uri)}`);
			await require('mkdirp-promise')(path.dirname(bufferURI.fsPath));
			fs.writeFileSync(bufferURI.fsPath, '');

			buffer = await vscode.workspace.openTextDocument(bufferURI);

			bufferBinding = new BufferBinding({
				buffer,
				isHost: false,
				didDispose: () => this.bufferBindingsByBufferProxy.delete(bufferProxy)
			});

			bufferBinding.setBufferProxy(bufferProxy);
			bufferProxy.setDelegate(bufferBinding);

			this.bufferBindingsByBuffer.set(buffer, bufferBinding);
			this.bufferBindingsByBufferProxy.set(bufferProxy, bufferBinding);
		}
		return buffer;
	}


	getTetherState() {
		return this.tetherState;
	}

	getTetherPosition() {
		return this.tetherPosition;
	}

	updateActivePositions(positionsBySiteId: any) {
		// this.sitePositionsComponent.update({positionsBySiteId})
	}


	siteDidJoin(siteId: any) {
		this.joinEvents.push(siteId);
	}

	siteDidLeave(siteId: never) {
		this.leaveEvents.push(siteId);
	}

	didChangeEditorProxies() { }
}
