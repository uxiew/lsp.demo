const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = require('http').Server(app);
app.set('view engine', 'ejs');
const ioServer = require('socket.io')(httpServer, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3031;

const expServer = httpServer.listen(PORT, () =>
  console.log(`Server started on port ${PORT}`)
);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get('/:roomId', (req, res) => {
  res.render('room', {
    roomId: req.params.roomId
  });
});

ioServer.sockets.on('connection', socket => {
  // logs server messages on the client
  socket.on('message', ({ room: roomId, message }) => {
    console.log('----message----', roomId, message);
    // for a real app, would be room-only (not broadcast)
    ioServer.in(roomId).emit('message', message);
  });

  socket.on('initiate peer', room => {
    console.log('Server initiating peer in room: ' + room);
    socket.to(room).emit('initiate peer', room);
  });

  socket.on('sending signal', message => {
    console.log('Handling send signal to room: ' + message.room);
    socket.to(message.room).emit('sending signal', message);
  });

  socket.on('create or join', roomId => {
    const userId = socket.id;
    socket.join(roomId);

    console.log('Client ID ' + userId + ' created room ' + roomId);
    socket.emit('join', roomId);
    socket.to(roomId).emit('user-connected', userId);
  });

  socket.on('hangup', () => console.log('received hangup'));
  socket.on('disconnect', reason => {
    console.log('Disconnecting this chat:', reason);
  });
});
