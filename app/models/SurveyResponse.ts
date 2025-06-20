import mongoose, { Schema, Document } from 'mongoose';

export interface ISurveyResponse extends Document {
  username: string;
  surveyId: string;
  surveyType: 'sorting' | 'likert' | 'multiple-choice' | 'text' | 'rating';
  response: any; // JSON data specific to survey type
  completedAt: Date;
  studyDay: number;
  sessionId?: string;
  timeSpent?: number; // in seconds
}

const SurveyResponseSchema: Schema = new Schema({
  username: { 
    type: String, 
    required: true,
    index: true 
  },
  surveyId: { 
    type: String, 
    required: true,
    index: true 
  },
  surveyType: { 
    type: String, 
    required: true,
    enum: ['sorting', 'likert', 'multiple-choice', 'text', 'rating']
  },
  response: { 
    type: Schema.Types.Mixed, 
    required: true 
  },
  completedAt: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  studyDay: { 
    type: Number, 
    required: true,
    index: true 
  },
  sessionId: { 
    type: String 
  },
  timeSpent: { 
    type: Number 
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
SurveyResponseSchema.index({ username: 1, surveyId: 1, studyDay: 1 });

export default mongoose.models.SurveyResponse || mongoose.model<ISurveyResponse>('SurveyResponse', SurveyResponseSchema);