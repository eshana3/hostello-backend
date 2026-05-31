import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  // Identity — one of these must exist
  mobile?: string;
  email?: string;
  googleId?: string;
  // Magic link
  magicLinkToken?: string;
  magicLinkExpiry?: Date;
  // Auth state
  isVerified: boolean;
  isAdmin: boolean;
  tokenVersion: number;
  // Profile
  name?: string;
  avatar?: string;
  hostel?: Types.ObjectId;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    mobile: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    googleId: { type: String, unique: true, sparse: true },
    magicLinkToken: { type: String, select: false },
    magicLinkExpiry: { type: Date, select: false },
    isVerified: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    name: { type: String, trim: true },
    avatar: { type: String },
    hostel: { type: Schema.Types.ObjectId, ref: "Hostel" },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ lastLogin: -1 });
UserSchema.index({ isAdmin: 1 });

export default mongoose.model<IUser>("User", UserSchema);
