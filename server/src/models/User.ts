import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  mobile: string;
  otp?: string;
  otpExpires?: Date;
  isVerified: boolean;
  isAdmin: boolean;
  tokenVersion: number;
  name?: string;
  hostel?: Types.ObjectId;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"],
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    name: {
      type: String,
      trim: true,
    },
    hostel: {
      type: Schema.Types.ObjectId,
      ref: "Hostel",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for daily active users query
UserSchema.index({ lastLogin: -1 });
UserSchema.index({ isAdmin: 1 });

export default mongoose.model<IUser>("User", UserSchema);
