import mongoose from 'mongoose';

const wellnessEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  mood: {
    type: Number,
    required: [true, 'Mood rating is required'],
    min: [1, 'Mood rating must be at least 1'],
    max: [5, 'Mood rating cannot exceed 5']
  },
  stress: {
    type: Number,
    min: [1, 'Stress level must be at least 1'],
    max: [10, 'Stress level cannot exceed 10']
  },
  sleep: {
    hours: {
      type: Number,
      min: [0, 'Sleep hours cannot be negative'],
      max: [24, 'Sleep hours cannot exceed 24']
    },
    quality: {
      type: Number,
      min: [1, 'Sleep quality must be at least 1'],
      max: [10, 'Sleep quality cannot exceed 10']
    },
    bedtime: String,
    wakeTime: String
  },
  energy: {
    type: Number,
    min: [1, 'Energy level must be at least 1'],
    max: [10, 'Energy level cannot exceed 10']
  },
  focus: {
    type: Number,
    min: [1, 'Focus level must be at least 1'],
    max: [10, 'Focus level cannot exceed 10']
  },
  anxiety: {
    type: Number,
    min: [1, 'Anxiety level must be at least 1'],
    max: [10, 'Anxiety level cannot exceed 10']
  },
  activities: [{
    type: String,
    enum: [
      'exercise', 'meditation', 'socializing', 'hobbies', 
      'studying', 'work', 'family_time', 'outdoor_activities',
      'reading', 'music', 'gaming', 'cooking', 'cleaning'
    ]
  }],
  symptoms: [{
    type: String,
    enum: [
      'headache', 'fatigue', 'difficulty_concentrating', 
      'irritability', 'sadness', 'worry', 'restlessness',
      'muscle_tension', 'stomach_issues', 'sleep_problems'
    ]
  }],
  triggers: [{
    type: String,
    enum: [
      'academic_pressure', 'social_issues', 'family_problems',
      'financial_stress', 'health_concerns', 'relationship_issues',
      'work_stress', 'major_changes', 'isolation', 'uncertainty'
    ]
  }],
  copingStrategies: [{
    strategy: String,
    effectiveness: {
      type: Number,
      min: 1,
      max: 10
    }
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  goals: [{
    description: String,
    completed: { type: Boolean, default: false }
  }],
  gratitude: [String],
  medications: [{
    name: String,
    dosage: String,
    taken: { type: Boolean, default: false },
    time: String
  }],
  appointments: [{
    type: {
      type: String,
      enum: ['therapy', 'counseling', 'medical', 'psychiatry']
    },
    date: Date,
    notes: String,
    rating: {
      type: Number,
      min: 1,
      max: 10
    }
  }],
  isPrivate: {
    type: Boolean,
    default: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relationship: {
      type: String,
      enum: ['parent', 'teacher', 'counselor', 'friend']
    },
    permissions: {
      view: { type: Boolean, default: true },
      comment: { type: Boolean, default: false }
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for overall wellness score
wellnessEntrySchema.virtual('wellnessScore').get(function() {
  const mood = this.mood || 3;
  const stress = this.stress ? (11 - this.stress) : 5; // Invert stress (lower is better)
  const sleep = this.sleep?.quality || 5;
  const energy = this.energy || 5;
  const focus = this.focus || 5;
  const anxiety = this.anxiety ? (11 - this.anxiety) : 5; // Invert anxiety
  
  const total = mood + stress + sleep + energy + focus + anxiety;
  const maxScore = 60; // 6 metrics * 10 max each
  
  return Math.round((total / maxScore) * 100);
});

// Method to get wellness trend
wellnessEntrySchema.statics.getWellnessTrend = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const entries = await this.find({
    user: userId,
    date: { $gte: startDate }
  }).sort({ date: 1 });
  
  return entries.map(entry => ({
    date: entry.date,
    mood: entry.mood,
    stress: entry.stress,
    sleep: entry.sleep?.quality,
    energy: entry.energy,
    focus: entry.focus,
    anxiety: entry.anxiety,
    wellnessScore: entry.wellnessScore
  }));
};

// Method to get wellness summary
wellnessEntrySchema.statics.getWellnessSummary = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const entries = await this.find({
    user: userId,
    date: { $gte: startDate }
  });
  
  if (entries.length === 0) {
    return {
      averageMood: 0,
      averageStress: 0,
      averageSleep: 0,
      averageEnergy: 0,
      averageFocus: 0,
      averageAnxiety: 0,
      averageWellnessScore: 0,
      totalEntries: 0,
      streakDays: 0
    };
  }
  
  const totals = entries.reduce((acc, entry) => {
    acc.mood += entry.mood || 0;
    acc.stress += entry.stress || 0;
    acc.sleep += entry.sleep?.quality || 0;
    acc.energy += entry.energy || 0;
    acc.focus += entry.focus || 0;
    acc.anxiety += entry.anxiety || 0;
    acc.wellnessScore += entry.wellnessScore || 0;
    return acc;
  }, {
    mood: 0, stress: 0, sleep: 0, energy: 0, 
    focus: 0, anxiety: 0, wellnessScore: 0
  });
  
  const count = entries.length;
  
  // Calculate streak
  const sortedEntries = entries.sort((a, b) => b.date - a.date);
  let streakDays = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    
    if (entryDate.getTime() === currentDate.getTime()) {
      streakDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return {
    averageMood: Math.round((totals.mood / count) * 10) / 10,
    averageStress: Math.round((totals.stress / count) * 10) / 10,
    averageSleep: Math.round((totals.sleep / count) * 10) / 10,
    averageEnergy: Math.round((totals.energy / count) * 10) / 10,
    averageFocus: Math.round((totals.focus / count) * 10) / 10,
    averageAnxiety: Math.round((totals.anxiety / count) * 10) / 10,
    averageWellnessScore: Math.round((totals.wellnessScore / count) * 10) / 10,
    totalEntries: count,
    streakDays
  };
};

// Ensure one entry per user per day
wellnessEntrySchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('WellnessEntry', wellnessEntrySchema);