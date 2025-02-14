import mongoose from 'mongoose';
import { threadId } from 'worker_threads';

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

const messageComparisonSchema = new mongoose.Schema({
  id: {
    type: String,
    required: false,
  },
  threadID: {
    type: String,
    required: true,
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
  title: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  feedback: {
    type: feedbackSchema,
    required: false,
  },
  selected: {
    type: Boolean,
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

const comparisonSchema = new mongoose.Schema({
  version1: {
    type: messageComparisonSchema,
    required: true
  },
  version2: {
    type: messageComparisonSchema,
    required: false
  },
})

const comparisonChatSchema = new mongoose.Schema({
  threadID: {
    type: String,
    required: true,
    unique: true,
  },  
  user: {
    type: String,
    required: true
  },
  latestTimestamp: {
    type: Date,
    required: false,
  },
  messages: [comparisonSchema],
});

const Chat = mongoose.models.ComparisonChat || mongoose.model('ComparisonChat', comparisonChatSchema);

export default Chat;