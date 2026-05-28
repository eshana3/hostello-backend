import mongoose, { Document, Schema } from "mongoose";

export interface IHostel extends Document {
  name: string;
  type: "KP" | "QC";
  number: number;
}

const HostelSchema = new Schema<IHostel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["KP", "QC"],
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IHostel>("Hostel", HostelSchema);
