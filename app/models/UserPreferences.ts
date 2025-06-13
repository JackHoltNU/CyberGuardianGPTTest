import mongoose from 'mongoose';

const userPreferencesSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  promptConfiguration: {
    personality: {
      type: String,
      required: true,
      default: "helpful"
    },
    languageDifficulty: {
      type: String,
      required: true,
      default: "intermediate"
    },
    answerLength: {
      type: String,
      required: true,
      default: "medium"
    },
    technicalDifficulty: {
      type: String,
      required: true,
      default: "intermediate"
    },
    instructionFormat: {
      type: String,
      required: true,
      default: "step-by-step"
    },
    personalityLabel: {
      type: String,
      required: true,
      default: "Helpful"
    },
    languageDifficultyLabel: {
      type: String,
      required: true,
      default: "Intermediate"
    },
    answerLengthLabel: {
      type: String,
      required: true,
      default: "Medium"
    },
    technicalDifficultyLabel: {
      type: String,
      required: true,
      default: "Intermediate"
    },
    instructionFormatLabel: {
      type: String,
      required: true,
      default: "Step-by-step"
    },
    specifyDevices: {
      type: Boolean,
      default: false
    },
    selectedDevices: {
      type: [String],
      default: []
    },
    computerType: {
      type: String,
      default: ""
    },
    tabletType: {
      type: String,
      default: ""
    },
    mobileType: {
      type: String,
      default: ""
    },
    browser: {
      type: String,
      default: ""
    },
    additionalInstructions: {
      type: String,
      default: ""
    }
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
userPreferencesSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const UserPreferences = mongoose.models.UserPreferences || mongoose.model('UserPreferences', userPreferencesSchema);

export default UserPreferences;