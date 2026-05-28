import mongoose, { Document, Schema } from 'mongoose';

export interface IListing extends Document {
  title: string;
  description: string;
  images: string[];
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  owner: mongoose.Types.ObjectId;
  amenities: string[];
  availability: boolean;
  category: 'room' | 'bed' | 'flat' | 'pg';
  contactNumber: string;
}

const ListingSchema = new Schema<IListing>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    price: { type: Number, required: true },
    location: {
      address: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, default: '' },
      pincode: { type: String, default: '' },
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amenities: [{ type: String }],
    availability: { type: Boolean, default: true },
    category: {
      type: String,
      enum: ['room', 'bed', 'flat', 'pg'],
      default: 'room',
    },
    contactNumber: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Listing = mongoose.model<IListing>('Listing', ListingSchema);
