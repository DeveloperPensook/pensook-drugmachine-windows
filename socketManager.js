const socketIo = require('socket.io');

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected');
  });
}

function callSocketIoFunction(event, data) {
  if (io) {
    io.emit(event, data);
  } else {
    console.error('Socket.io is not initialized');
  }
}

module.exports = {
  initializeSocket,
  callSocketIoFunction,
};
