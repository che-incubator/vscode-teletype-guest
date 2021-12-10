# VS Code Extension with Teletype Libraries (Development in Progress)
This repository is for the VS Code extension with Teletype libraries. This extension can be executed in Eclipse Che sidecar as a remote plugin. The aim of this extension is to implement the CoEditing skeleton for Eclipse Che and Theia so that contributors can have the experience similar to Google Docs. This skeleton can be further used for mentoring sessions, code reviews, and co-editing.

## Running the extension in VS Code

- Clone the respository to your local system
```
git clone https://github.com/che-incubator/vscode-teletype-guest.git
```

- Open terminal and navigate to the cloned respository and use command _code_ in the terminal to launch VS Code.
```
code
```
<img src="figs/code.png" width="700" height="400" alt="Launch VS Code">

- Inside the editor, press _F5_ to compile and launch your extension in a new _Extension Development Host_ window.

<img src="figs/window.png" width="700" height="400" alt="Launch VS Code">

- Inside the _Extension Development Host_ window, use command _CTRL + SHIFT + P_ to open the Command Palette and to find the commands associated with this extension.

<img src="figs/command_view.png" width="700" height="400" alt="Launch VS Code">

- Use command _Join Portal_ in the Command Palette to join the session launched be Teletype Host.

<img src="figs/join_portal.png" width="700" height="400" alt="Launch VS Code">

## TODO

TODO for one single operation at the time

- teletype -> vscode
  - [ ] Log all editing messages from teletype
  - [ ] Get remote file on client side & display remote file to the webview
  - [ ] Display remote file on a VSCode editor
  - [ ] Apply remote changes (cursor position, text change) on client side
- vscode -> Teletype
  - [ ] vscode: log all the editing messages in vscode
  - [ ] display the content of a file when a new editor is opened
  - [ ] send all the editing messages/editor openned to the jsclient
  - [ ] apply changes to teletype
