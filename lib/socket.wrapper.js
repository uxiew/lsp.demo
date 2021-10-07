const Socket = require('simple-websocket');
const qs = require('querystringify');

const SimplePeerClientWrapper = require('./peer.wrapper.js');

class SocketIOClientWrapper {
  constructor({
    stream,
    serverUrl = 'ws://' + window.location.host,
    roomId,
    userId,
    debug = false,
    simplePeerOptions = {}
  } = {}) {
    this.debug = debug;
    this._initiator = false;

    this.roomId = roomId; // sassa
    this.userId = userId; // sassa

    if (typeof serverUrl === 'undefined') {
      console.error(
        'simple-peer-wrapper requires that you specify a serverUrl on startup. Please specify a serverUrl and try again. See documentation for more information https://github.com/lisajamhoury/simple-peer-wrapper'
      );
    }

    this.debug && console.log('connecting socket to ' + serverUrl);
    this.socket = new Socket(
      serverUrl +
        qs.stringify(
          {
            roomId,
            userId
          },
          true
        )
    );

    this.peerClient = new SimplePeerClientWrapper(
      this.socket,
      this.debug,
      simplePeerOptions,
      this.roomId,
      this.userId // sassa
    );

    this.encodeMsg = this.peerClient.encodeMsg;

    if (typeof stream !== 'undefined') {
      this.peerClient.setlocalStream(stream);
    }

    this.socket.on('error', err => {
      console.error('[lsp error]', err.stack || err.message || err);
    });

    this.socket.on('data', data => this._initSocket(data));
  }

  _initSocket(data) {
    console.log('====_initSocket===', data, JSON.parse(data));
    const { content, roomId: room, userId } = JSON.parse(data);
    switch (content.type) {
      case 'create-join':
        {
          this._handleCreateAndJoin(room);
        }
        break;
      case 'initiate peer':
        {
          this._handleInitPeer(room);
        }
        break;
      case 'sending signal':
        {
          this._handleSendSignal(room, content);
        }
        break;

      default:
        {
          this._handleMessage(userId, content);
        }
        break;
    }

    // this.socket.on('log', array => this._log(array));
    // this.socket.on('message', message => this._handleMessage(message));
  }

  // starts socket client communication with signal server automatically, create & join a room
  startCommunication(room) {
    this.debug && console.log('Attempted to create or join room: ', room);
    const joinApi = `http://110.42.220.32:9528/api/v1/im/join`;
    fetch(joinApi, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify({
        roomId: room,
        userId: this.userId
      })
    })
      .then(async data => {
        const { code } = await data.json(); // maybe:ok: false  status: 504
        if (code === 200) {
          this.debug && console.log('call join room api successfully!', room);
          this._handleCreateAndJoin(room);
          this.socket.send(this.encodeMsg('create-join'));
        }
      })
      .catch(error => {
        console.error('[lsp join room api occurred]', error);
      });
  }

  _handleCreateAndJoin(room) {
    this.debug && console.log('Create room ' + room);
    this._handleJoinRoom(room);
  }

  // called by client
  _handleJoinRoom(room) {
    this.debug && console.log('joined: ' + room);

    const connection = this._findConnection(room);
    this._createConnection(room, !connection, true, false);
    if (this.peerClient.initPeerRequest) {
      this.debug && console.log('initing peer from handle joined');
      this.peerClient.init();
    }
  }

  _createConnection(_room, _initiator, _roomReady, _peerStarted) {
    this.debug && console.log('create connection for connect!');
    const newConnection = {
      room: _room, // socket.io server room
      initiator: _initiator, // client initiates the communication
      roomReady: _roomReady, // socket.io room is created or joined
      peerStarted: _peerStarted // the peer connection is started
    };

    this.peerClient.connections.push(newConnection);
    return newConnection;
  }

  // 打印服务器消息
  _log(array) {
    log.apply(console, array);
  }

  // 建立 peer 连接
  _handleInitPeer(room) {
    this.debug && console.log('establish peer webrtc!', room);
    const connection = this._findConnection(room);
    this.peerClient.peerStart(connection);
  }

  _handleSendSignal(room, message) {
    this.debug && console.log('receiving simple signal data', message);
    const connection = this._findConnection(room);

    if (!connection.peerStarted) {
      this.debug && console.log('Creating peer from messages!');
      this.peerClient.createPeerConnection(connection);
      connection.peer.signal(message.data);
    } else {
      connection.peer.signal(message.data);
    }
  }

  /**
   * 查找对应已有房间的连接
   */
  _findConnection(room) {
    let connection = null;

    for (const linkConnection of this.peerClient.connections) {
      if (linkConnection.room === room) {
        connection = linkConnection;
      }
    }

    if (connection === null) {
      this.debug && console.log('OH THAT CONNECTION DOESNT EXIST');
    } else {
      this.debug && console.log('found the connection for room: ' + room);
    }

    return connection;
  }

  // This client receives a message
  _handleMessage(userId, { message }) {
    this.debug && console.log('MESSAGE ' + message);

    if (message.type) {
      this.debug && console.log('received msg typ ' + message.type);
    } else {
      this.debug && console.log('Client received message: ' + message);
    }

    this.peerClient.onMessageCallback({
      sender: userId,
      content: message
    });
    // TO DO HANDLE BYE
    // } else if (message === 'bye' && peerStarted) {
    //   handleRemoteHangup();
  }

  sendMessage(message) {
    this.debug && console.log('Client sending message: ', message);
    this.socket.send(this.encodeMsg('message', { message }));
  }
}

module.exports = SocketIOClientWrapper;
