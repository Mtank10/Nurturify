import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'parent', 'admin'],
    default: 'student'
  },
  grade: {
    type: String,
    required: function() { return this.role === 'student'; }
  },
  avatar: {
    type: String,
    default: null
  },
  profile: {
    dateOfBirth: Date,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String
    }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      assignments: { type: Boolean, default: true },
      wellness: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      messages: { type: Boolean, default: true }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
      showOnlineStatus: { type: Boolean, default: true },
      allowMessages: { type: Boolean, default: true }
    },
    theme: {
      darkMode: { type: Boolean, default: false },
      language: { type: String, default: 'en' }
    }
  },
  gamification: {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    achievements: [{
      achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' },
      unlockedAt: { type: Date, default: Date.now }
    }],
    streaks: {
      study: { type: Number, default: 0 },
      wellness: { type: Number, default: 0 },
      login: { type: Number, default: 0 }
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
};

export default mongoose.model('User', userSchema);