const SocketIOClientWrapper = require('./socket.wrapper');

class LspPeer {
  constructor(options) {
    this.socketClient = new SocketIOClientWrapper(options);
    this.peerClient = this.socketClient.peerClient;
  }

  connect() {
    return this.peerClient.init();
  }

  join(roomId) {
    this.socketClient.startCommunication(roomId);
  }

  isConnectionStarted() {
    return this.peerClient.isPeerStarted();
  }

  // send(data) {
  //   this.peerClient.sendData(data);
  // }
  send(data) {
    this.socketClient.sendMessage(data);
  }

  on(event, callback) {
    this.peerClient.setEventCallback(event, callback);
  }

  close() {
    this.peerClient.terminateSession();
  }
}

module.exports = LspPeer;
