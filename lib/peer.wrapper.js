const Peer = require('simple-peer');
const { play } = require('./helper');

class PeerClientWrapper {
  constructor(socket, debug, peerOptions, roomId, userId) {
    if (!Peer.WEBRTC_SUPPORT) {
      throw new Error('Your Browser does not support WEBRTC !');
    }
    this.initPeerRequest = false;
    this.socket = socket;
    this.peer = null;
    this.userId = userId;
    this.roomId = roomId;
    this.localStream;
    this.debug = debug;
    this.connections = [];
    this.onMessageCallback;
    this.onDataCallback;
    this.onStreamCallback;
    // this.onTrackCallback;
    this.onCloseCallback;
    this.onErrorCallback;
    this.peerOptions = peerOptions;
  }

  encodeMsg(type = 'message', content = null) {
    return JSON.stringify({
      Cmd: 1,
      userId: this.userId,
      roomId: this.roomId,
      content: {
        type,
        ...content
      }
    });
  }

  setlocalStream(stream) {
    this.localStream = stream;
  }

  init() {
    this.debug &&
      console.log('running init Peer Client. # of ' + this.connections.length);
    this.initPeerRequest = true;

    for (const connection of this.connections) {
      this.socket.send(this.encodeMsg('initiate peer'));
      if (connection.initiator) {
        this.peerStart(connection);
      }
    }

    return new Promise(resolve => {
      this.socket.once('connect', e => {
        this.debug && console.log('WebSocket is connect established!');
        resolve(e);
      });
    });
  }

  // 开始建立 rtc 通道
  peerStart(connection) {
    this.debug &&
      console.log(
        'simple - peer start',
        connection.peerStarted,
        connection.roomReady
      );

    if (!connection.peerStarted && connection.roomReady) {
      this.debug && console.log('Creating peer connection');
      this.createPeerConnection(connection);
    } else {
      this.debug && console.log('Not creating peer connection');
    }
  }

  createPeerConnection(connection) {
    const options = this._getPeerOptions(connection.initiator);
    const peer = new Peer(options);

    // If initiator,peer.on'signal' will fire right away, if not it waits for signal
    // https://github.com/feross/simple-peer#peeronsignal-data--
    peer.on('signal', data => this._sendSignal(data, connection));
    peer.on('connect', data => this._handleConnection(data));
    peer.on('error', err => this._handleError(err));
    peer.on('stream', stream => this._handleStream(stream));
    peer.on('data', data => this._handleData(data));
    // peer.on('track', (track, stream) =>
    //   this._handleTrack(track, stream),
    // );
    peer.on('close', () => this._handleClose());

    connection.peerStarted = true;
    connection.peer = peer;
    this.peer = peer;

    this.debug && console.log('creating simple peer done!');
  }

  isPeerStarted() {
    let peerStarted = false;

    // if any peer connection is not started then it returns false
    for (const connection of this.connections) {
      peerStarted = connection.peerStarted;
    }
    return peerStarted;
  }

  setEventCallback(event, callback) {
    switch (event) {
      case 'data':
        this.onDataCallback = callback;
        break;
      case 'stream':
        this.onStreamCallback = callback;
        break;
      // case 'track':
      //   this.onTrackCallback = callback;
      //   break;
      case 'close':
        this.onCloseCallback = callback;
        break;
      case 'message':
        this.onMessageCallback = callback;
        break;
      case 'error':
        this.onErrorCallback = callback;
    }
  }

  sendData(data) {
    let msg = JSON.stringify({ data: data, userId: this.socket.id });
    for (let peer of this.connections) {
      if (peer.peerStarted) {
        const peerConn = peer.peer;
        if (peerConn.connected) {
          peerConn.write(msg);
        }
      }
    }
  }

  terminateSession() {
    for (let connection of this.connections) {
      const peer = connection.peer;
      peer.destroy(); // simple-peer method to close and cleanup peer connection
      connection.peer = null;
      this.peer = null;
      connection.peerStarted = false;
    }

    this.socket.send(this.encodeMsg('hangup'));
    this.socket.close();
    // sendMessage('hangup');
  }

  _getPeerOptions(initiator) {
    const options = {
      initiator: initiator
    };

    if (typeof this.localStream !== 'undefined') {
      options.stream = this.localStream;
    }

    const spOptions = Object.entries(this.peerOptions);

    if (spOptions.length > 0) {
      for (const [key, value] of spOptions) {
        options[key] = value;
      }
    }

    return options;
  }

  // send signal data
  _sendSignal(data, connection) {
    this.debug && console.log('----sending signal----');
    this.socket.send(this.encodeMsg('sending signal', { data }));
  }

  _handleConnection(data) {
    console.log('SIMPLE PEER IS CONNECTED');
  }

  addStream(stream) {
    this.peer.addStream(stream);
  }

  // 处理用户音视频流
  _handleStream(mediastream) {
    Object.assign(mediastream, {
      play
    });
    this.onStreamCallback(mediastream);
  }

  _handleError(err) {
    if (typeof this.onErrorCallback !== 'undefined') {
      this.onErrorCallback(err);
    } else {
      console.log(err);
    }
  }

  _handleData(data) {
    const decodedString = new TextDecoder('utf-8').decode(data);
    const decodedJSON = JSON.parse(decodedString);
    this.onDataCallback(decodedJSON);
  }

  _handleClose() {
    if (typeof this.onCloseCallback !== 'undefined') {
      this.onCloseCallback();
    }

    this.debug && console.log('Closing Connection');
    //// this._handleRemoteHangup();
    // closePeerConnection();
    // sendMessage('bye');
  }

  _handleRemoteHangup() {
    this.debug && console.log('Handling remote hangup');
    this.terminateSession(true);
    // closePeerConnection();
    // initiator = false;
  }

  _closePeerConnection() {
    // peerStarted = false;
    // peer.destroy();
    // peer = null;
  }
}

module.exports = PeerClientWrapper;
