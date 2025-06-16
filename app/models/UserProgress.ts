import mongoose, { Schema, Document } from "mongoose";

export interface IDailyInteraction {
  day: number;
  date: Date;
  interactionCount: number;
  firstInteractionTime: Date;
}

export interface IUserProgress extends Document {
  username: string;
  studyStartDate: Date;
  dailyInteractions: IDailyInteraction[];
  currentDay: number;
  completedDays: number;
  isStudyComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DailyInteractionSchema = new Schema<IDailyInteraction>({
  day: {
    type: Number,
    required: true,
    min: 1,
    max: 14
  },
  date: {
    type: Date,
    required: true
  },
  interactionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  firstInteractionTime: {
    type: Date,
    required: true
  }
});

const UserProgressSchema = new Schema<IUserProgress>({
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  studyStartDate: {
    type: Date,
    required: true
  },
  dailyInteractions: [DailyInteractionSchema],
  currentDay: {
    type: Number,
    default: 1,
    min: 1,
    max: 14
  },
  completedDays: {
    type: Number,
    default: 0,
    min: 0,
    max: 14
  },
  isStudyComplete: {
    type: Boolean,
    default: false
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

UserProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const UserProgress = mongoose.models.UserProgress || mongoose.model<IUserProgress>("UserProgress", UserProgressSchema);

export default UserProgress;