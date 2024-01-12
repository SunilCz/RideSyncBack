const mongoose = require('mongoose');

class ServerStore {
  constructor() {
    // Check if the Chat model already exists
    if (mongoose.models.Chat) {
      this.ChatModel = mongoose.model('Chat');
    } else {
      // Define the Chat model
      const chatSchema = new mongoose.Schema({
        roomId: {
          type: String,
          required: true,
        },
        messages: [
          {
            senderId: {
              type: String,
              required: true,
            },
            message: {
              type: String,
              required: true,
            },
            timestamp: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      });

      this.ChatModel = mongoose.model('Chat', chatSchema);
    }
  }

  async storeChatMessage(roomId, message) {
    try {
      let chat = await this.ChatModel.findOne({ roomId });

      if (!chat) {
        chat = new this.ChatModel({ roomId, messages: [] });
      }

      chat.messages.push(message);
      await chat.save();

      return chat;
    } catch (error) {
      throw new Error(`Error storing chat message: ${error.message}`);
    }
  }

  async getRoomMessages(roomId) {
    try {
      const chat = await this.ChatModel.findOne({ roomId });
      return chat ? chat.messages : [];
    } catch (error) {
      throw new Error(`Error getting room messages: ${error.message}`);
    }
  }
}

module.exports = new ServerStore();
