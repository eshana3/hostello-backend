import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  mobile: string;
  name?: string;
  email?: string;
  role: 'student' | 'hostelOwner';
  isVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  refreshToken?: string;
}

const UserSchema = new Schema<IUser>(
  {
    mobile: { type: String, required: true, unique: true, trim: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    role: { type: String, enum: ['student', 'hostelOwner'], default: 'student' },
    isVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
