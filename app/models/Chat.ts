import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['system', 'user', 'assistant'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatSchema = new mongoose.Schema({
  threadID: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String
  },
  user: {
    type: String,
    required: true
  },
  messages: [messageSchema],
});

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;