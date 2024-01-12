
const serverStore = require('../serverStore');

const sharedLocations = {};


const handleConnection = (socket, io) => {
  console.log("Connected & Socket Id is ", socket.id);
  socket.emit("Data", "first emit");

  socket.on("Realtime", (data) => {
    console.log(data);
  });

  socket.on("ShareLocation", (data) => {
    try {
      console.log("Location data received:", data);

      // Store the shared location data
      sharedLocations[data.userId] = data;

      // Broadcast the location data to all connected clients
      io.emit("SharedLocation", data);
      console.log('Location data emitted to all connected clients.', data);

    } catch (error) {
      console.error('Error handling location data:', error.message);
    }
  });

  socket.on("TrackLocation", (userId) => {
    try {
      // Retrieve the shared location data for the specified user
      const locationData = sharedLocations[userId];

      if (locationData) {
        // Send the location data to the tracking client
        socket.emit("TrackedLocation", locationData);
        console.log('Tracked location data sent to the client.', locationData);
      } else {
        console.log('Location data not found for user:', userId);
      }

    } catch (error) {
      console.error('Error handling track location request:', error.message);
    }
  });

  //chat room
  
  socket.on('SendMessage', async (data) => {
    try {
      const message = {
        senderId: data.senderId,
        message: data.message,
        timestamp: Date.now(),
      };

      // Store the chat message in the database
      const chat = await serverStore.storeChatMessage(data.roomId, message);

      // Broadcast the updated messages to all connected clients in the room
      io.to(data.roomId).emit('ReceivedMessage', {
        roomId: data.roomId,
        messages: chat.messages,
      });

      console.log('Message emitted to all connected clients in the room.', data);
    } catch (error) {
      console.error('Error handling chat message:', error.message);
    }
  });

  // Listen for requests to fetch room messages
  socket.on('getRoomMessages', async (roomId) => {
    try {
      // Fetch chat messages for the specified room from the database
      const messages = await serverStore.getRoomMessages(roomId);

      // Emit the messages to the client
      socket.emit('roomMessages', { roomId, messages });
    } catch (error) {
      console.error('Error fetching room messages:', error.message);
    }
  });
};

module.exports = {
  handleConnection,
};
