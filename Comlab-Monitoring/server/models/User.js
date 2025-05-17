// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function() {
      // Password is only required for regular email/password login, not OAuth
      return !this.googleId; 
    },
    minlength: 10,
    validate: {
      validator: function (v) {
        // Skip validation if using OAuth
        if (this.googleId) return true;
        const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*-_])/;
        return pattern.test(v);
      },
      message: 'Password must contain at least one uppercase, one lowercase, one number, and one special character (!@#$%^&*-_)',
    },
  },
  name: { type: String },
  lastname: { type: String },
  role: { type: String, enum: ['user', 'instructor', 'admin'], default: 'user' },
  phoneNumber: {
    type: String,
    required: function() {
      // Phone number is only required for regular registration
      return !this.googleId;
    },
    validate: {
      validator: function (v) {
        // Skip validation if using OAuth or if field is not required
        if (this.googleId) return true;
        return /^\d{11}$/.test(v); // Allow exactly 11 digits
      },
      message: 'Phone number must be exactly 11 digits.',
    },
    sparse: true, // Allow null/undefined values without triggering uniqueness validation
  },
  googleId: { type: String, sparse: true, unique: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String, sparse: true, unique: true },
  verificationTokenExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

userSchema.methods.generateVerificationToken = function () {
  this.verificationToken = uuidv4();
  this.verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
};

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema, 'users');
export default User;
