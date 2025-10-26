const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  beaconId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  course: {
    type: String,
    required: true
  },
  subjects: [{
    type: String,
    ref: 'Class' // Reference to class/subject IDs
  }],
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  section: {
    type: String,
    default: 'A'
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

// Update the updatedAt field before saving
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Student', studentSchema);
