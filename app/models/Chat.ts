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

const promptConfigSchema = new mongoose.Schema({
  id: String,
  personality: String,
  languageDifficulty: String,
  answerLength: String,
  technicalDifficulty: String,
  instructionFormat: String,
  personalityLabel: String,
  languageDifficultyLabel: String,
  answerLengthLabel: String,
  technicalDifficultyLabel: String,
  instructionFormatLabel: String,
  specifyDevices: Boolean,
  selectedDevices: [String],
  computerType: String,
  tabletType: String,
  mobileType: String,
  browser: String,
  additionalInstructions: String
});

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
  },
  promptConfig: {
    type: promptConfigSchema,
    required: false
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  selectionTimestamp: {
    type: Date,
    required: false
  }
});

const chatSchema = new mongoose.Schema({
  threadID: {
    type: String,
    required: true,
    unique: true,
  },
  dualChatID: {
    type: String,
    required: false,
    index: true,
  },
  configName: {
    type: String,
    required: false,
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