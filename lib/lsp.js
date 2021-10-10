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

  // =========== device =======
  async shareScreen($video, constraints) {
    return this.deviceManager.shareScreen($video, {
      video: true,
      audio: true,
      ...constraints
    });
  }

  async publishVideo($video, constraints) {
    const videoStream = await this.deviceManager.getCameraVideo(
      $video,
      constraints
    );
    return videoStream;
    // this.peerClient.addStream(videoStream);
  }

  async publishAudio($video, constraints) {
    const videoStream = await this.deviceManager.getCameraVideo(
      $video,
      constraints
    );
    return videoStream;
    // this.peerClient.addStream(videoStream);
  }

  async publishStream($video, constraints) {
    const videoStream = await this.deviceManager.getCameraAndMic();

    return videoStream;
    // this.peerClient.addStream(videoStream);
  }
}

module.exports = LspPeer;
