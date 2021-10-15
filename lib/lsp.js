const SocketIOClientWrapper = require('./socket.wrapper');
const DCM = require('./device.wrapper');

class LspPeer {
  constructor(options) {
    this.socketClient = new SocketIOClientWrapper(options);
    this.peerClient = this.socketClient.peerClient;
    this.deviceManager = new DCM();
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

  addStream(mediaStream) {
    this.peerClient.addStream(mediaStream);
  }

  // =========== device =======
  async shareScreen($video, constraints) {
    return this.deviceManager.shareScreen($video, {
      video: true,
      audio: true,
      ...constraints
    });
  }

  async publishVideo($video, constraints) {
    const streamData = await this.deviceManager.getCameraVideo(
      $video,
      constraints
    );
    this.peerClient.addStream(streamData.videoStream);
    return streamData;
  }

  async publish($video, constraints) {
    const streamData = await this.deviceManager.publish($video, constraints);
    this.peerClient.addStream(streamData.videoStream);
    this.peerClient.addStream(streamData.audioStream);
    return streamData;
  }
}

module.exports = LspPeer;
