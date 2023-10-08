const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
require("dotenv").config();

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`A user connected with socketId: ${socket.id}`);

  socket.on('message', (data) => {
    console.log('Received a "message" event:', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected with socketId: ${socket.id}`);
  });
});

const stockLedgerRoutes = require('./routes/stockLedgerRoutes')

app.set("socketio", io);
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

app.use('/api/stockLedger/', stockLedgerRoutes)

const port = process.env.API_SERVER_PORT || 6007;

// io.on('connection', (socket) => {
//   console.log('A user connected');

//   let objTest = {
//     page: "idle",
//     message: {
//       pin: 123456
//     }
//   }
//   let jsonString = JSON.stringify(objTest);
//   socket.emit('message', jsonString);

//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
// });

http.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = {
  app
};