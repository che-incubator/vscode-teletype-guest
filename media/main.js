(function () {
  const vscode = acquireVsCodeApi();

  window.addEventListener('message', async (event) => {
    const message = event.data;

    switch (message.command) {
      case 'init': {
        await joinPortal(message.data);
        break;
      }
    }
  });

  const VSCodeClient = {
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

      client.initialize();

      const portalDelegate = CheTeletype.createPortalBinding()
      const portal =  await client.joinPortal(portalId);

      VSCodeClient.showInformationMessage(`Joined Portal with ID ${portalId}`);

      portal.setDelegate(portalDelegate)
      console.log("activebufferproxyuri : " + portalDelegate.getTetherBufferProxyURI())

      const editorProxy = portalDelegate.getTetherEditorProxy();
      const bufferProxy = editorProxy.bufferProxy;
      const bufferDelegate = CheTeletype.createBufferBinding();

      bufferProxy.setDelegate(bufferDelegate)

      console.log(bufferProxy);

      // bufferProxy.setTextInRange(...guestBufferDelegate.insert({row: 0, column: 0},'hello from a browser\n'))
      // bufferProxy.setTextInRange({row:0,column:0},{row: 0, column: 0}, "test");

      VSCodeClient.openEditor(bufferProxy.uri, 'Hello');
    } catch (err) {
      console.log('Inside the catch block of creating teletype client');

      console.log("Exception Error Message " + err);

      VSCodeClient.showErrorMessage(err.message);
    }

    // portal_binding = new PortalBinding({ client: client, portalId: portalId, editor: textEditor });
    // await portal_binding.initialize();
  }
}());
