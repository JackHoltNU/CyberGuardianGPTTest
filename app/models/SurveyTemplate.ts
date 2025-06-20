import mongoose, { Schema, Document } from 'mongoose';

export interface ISurveyTemplate extends Document {
  name: string;
  title: string;
  instructions: string;
  criteria: string;
  items: string; // JSON string of items
  studyDays: string; // Comma-separated days (e.g., "1,3,7")
  isActive: boolean;
  isLocalhost: boolean; // Show on localhost only
  createdAt: Date;
  updatedAt: Date;
}

const SurveyTemplateSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  instructions: { 
    type: String, 
    required: true
  },
  criteria: { 
    type: String, 
    required: true
  },
  items: { 
    type: String, 
    required: true
  },
  studyDays: { 
    type: String, 
    default: ''
  },
  isActive: { 
    type: Boolean, 
    default: false
  },
  isLocalhost: { 
    type: Boolean, 
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
SurveyTemplateSchema.index({ isActive: 1, isLocalhost: 1, studyDays: 1 });

export default mongoose.models.SurveyTemplate || mongoose.model<ISurveyTemplate>('SurveyTemplate', SurveyTemplateSchema);