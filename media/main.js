(function () {
  const vscode = acquireVsCodeApi();

  window.addEventListener('message', async (event) => {
    const message = event.data;

    switch (message.command) {
      case 'portal-connection-info': {
        await joinPortal(message.data);
        vscode.postMessage({ command: 'init.ok' });
        break;
      }
    }
  });

  const VSCodeClient = {
    getPortalConnectionInfo() {
      vscode.postMessage({
        command: 'get-portal-connection-info',
      });
    },
    showInformationMessage(text) {
      vscode.postMessage({
        command: 'show-info-message',
        data: text,
      });
    },
    showWarningMessage(text) {
      vscode.postMessage({
        command: 'show-warn-message',
        data: text,
      });
    },
    showErrorMessage(text) {
      vscode.postMessage({
        command: 'show-error-message',
        data: text,
      });
    },
    openEditor(filename, content) {
      vscode.postMessage({
        command: 'open-editor',
        data: { filename, content },
      });
    },
  };

  async function joinPortal({ endpoint, portalId, authToken, pusher }) {
    console.log('Inside the function call of JoinPortal');

    try {
      const { client } = new CheTeletype({
        pusherKey: pusher.key,
        pusherOptions: {
          cluster: pusher.cluster,
        },
        baseURL: endpoint,
      });

      console.log(client);

      await client.initialize();
      await client.signIn(authToken);

      console.log('Inside the try block of creating teletype client');

      const portalDelegate = CheTeletype.createPortalBinding();
      const portal =  await client.joinPortal(portalId);

      VSCodeClient.showInformationMessage(`Joined Portal with ID ${portalId}`);

      portal.setDelegate(portalDelegate)
      console.log("activebufferproxyuri : " + portalDelegate.getTetherBufferProxyURI())

      const editorProxy = portalDelegate.getTetherEditorProxy();
      const bufferProxy = editorProxy.bufferProxy;
      const bufferDelegate = CheTeletype.createBufferBinding();

      bufferProxy.setDelegate(bufferDelegate);

      // console.log(bufferProxy);
      console.log(bufferProxy.emitter.handlersByEventName);
      console.log('>>>', vsapi.TextDocument('http://'));

      // bufferProxy.setTextInRange(...guestBufferDelegate.insert({row: 0, column: 0},'hello from a browser\n'))
      // bufferProxy.setTextInRange({row:0,column:0},{row: 0, column: 0}, "test");

      console.log(bufferProxy.document.documentTree.root.text);
      VSCodeClient.openEditor(bufferProxy.uri, bufferProxy.document.documentTree.root.text);

      // debugger;
    } catch (err) {
      console.log('Inside the catch block of creating teletype client');

      console.log("Exception Error Message " + err);

      VSCodeClient.showErrorMessage(err.message);
    }

    // portal_binding = new PortalBinding({ client: client, portalId: portalId, editor: textEditor });
    // await portal_binding.initialize();
  }

  VSCodeClient.getPortalConnectionInfo();
}());
