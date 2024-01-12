require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const userRoute = require('./routes/userRoute');
const errorHandler = require('./middleware/errorMiddleware');
const http = require('http');
const socketIO = require('socket.io');
const socketController = require('./controllers/socketController'); // Import socketController
const socketRoutes = require('./routes/socketRoutes'); // Import socketRoutes
const app = express();
const httpServer = http.createServer(app);

// Use the same http server instance for Socket.IO
const io = new socketIO.Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Use an environment variable
    methods: ['GET', 'POST'],
  },
});
io.on('connection', (socket) => {
  socketController.handleConnection(socket, io);
})
// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  cors({
    origin: ['http://localhost:3000', 'https://authz-app.vercel.app', 'http://192.168.18.10:3000'],
    credentials: true,
  })
);

// Routes
app.use('/api/users', userRoute);
app.use("/socket", socketRoutes);
app.get('/', (req, res) => {
  res.send('Home Page');
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI).then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});


exports.io = io; // Export the Socket.IO instance so it can be used in socketRoutes.js