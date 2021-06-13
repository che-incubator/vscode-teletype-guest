(function () {
  window.addEventListener('message', async (event) => {
    const message = event.data;

    switch (message.command) {
      case 'init': {
        await joinPortal(message.data);
        break;
      }
    }
  });

  async function joinPortal({ endpoint, portalId, authToken, pusher }) {
    console.log('Inside the function call of JoinPortal');

    // let textEditor = vscode.window.activeTextEditor;
    let portal_binding;
    if (authToken !== '') {
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
        // await client.signIn(constants.AUTH_TOKEN);
        await client.signIn(authToken);

        console.log('Inside the try block of creating teletype client');

        client.initialize();

        const guestPortalDelegate = CheTeletype.createPortalBinding()
        const guestPortal =  await client.joinPortal(portalId);

        guestPortal.setDelegate(guestPortalDelegate)
        console.log("activebufferproxyuri : " + guestPortalDelegate.getTetherBufferProxyURI())

        const guestEditorProxy = guestPortalDelegate.getTetherEditorProxy()

        const guestBufferProxy = guestEditorProxy.bufferProxy

        const guestBufferDelegate = CheTeletype.createBufferBinding()
        guestBufferProxy.setDelegate(guestBufferDelegate)

        console.log(CheTeletype);

        // guestBufferProxy.setTextInRange(...guestBufferDelegate.insert({row: 0, column: 0},'hello from a browser\n'))
        // guestBufferProxy.setTextInRange({row:0,column:0},{row: 0, column: 0}, "test");

      } catch (e) {
        console.log('Inside the catch block of creating teletype client');

        console.log("Exception Error Message " + e);
      }

      // portal_binding = new PortalBinding({ client: client, portalId: portalId, editor: textEditor });
      // await portal_binding.initialize();
    } else {
      console.error("GitHub Auth Token. Please provide it in the constants.ts file");
    }
  }
}());
