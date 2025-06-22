import mongoose from 'mongoose';

const conversationStarterSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
conversationStarterSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ConversationStarter = mongoose.models.ConversationStarter || mongoose.model('ConversationStarter', conversationStarterSchema);

export default ConversationStarter;