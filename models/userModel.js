// models/userModel.js

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; // <-- Import crypto

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // No two users can have the same email
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['Attendee', 'Organizer', 'Admin'], // Role must be one of these values
    default: 'Attendee',
  },
  platformUserId: { // <-- ADD THIS FIELD
      type: String,
      required: true,
      unique: true,
      default: () => `evt-usr-${crypto.randomUUID()}`, // Auto-generate a unique ID
    },
});

// Middleware to hash password before saving the user document
userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) {
    return next();
  }

  // Hash the password with a cost factor of 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with the hashed password in the DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;