import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  upvoted: {
    type: Boolean,
    required: true
  },
  downvoted: {
    type: Boolean,
    required: true
  },
  comments: {
    type: [String],
  }
})

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: false,
  },
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
  feedback: {
    type: feedbackSchema,
    required: false,
  },
  model: {
    type: String,
    required: false,
  },
  mainPrompt: {
    type: String,
    required: false
  },
  formatPrompt: {
    type: String,
    require: false
  }
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
  tags: {
    type: [String]
  },
  user: {
    type: String,
    required: true
  },
  latestTimestamp: {
    type: Date,
    required: false,
  },
  messages: [messageSchema],
});

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;