import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  name: string;
  avatar?: string;
  hostel?: string;
  isVerified: boolean;
  isAdmin: boolean;
  tokenVersion: number;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:     { type: String, select: false },
    name:         { type: String, required: true, trim: true },
    avatar:       { type: String },
    hostel:       { type: String },
    isVerified:   { type: Boolean, default: false },
    isAdmin:      { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    lastLogin:    { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", UserSchema);
