import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load env from server root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import Hostel from "../models/Hostel";

// ── Hostel data ──────────────────────────────────────────────────
const KP_HOSTELS = Array.from({ length: 25 }, (_, i) => ({
  name: `KP-${i + 1}`,
  type: "KP" as const,
  number: i + 1,
}));

const QC_HOSTELS = Array.from({ length: 13 }, (_, i) => ({
  name: `QC-${i + 1}`,
  type: "QC" as const,
  number: i + 1,
}));

const ALL_HOSTELS = [...KP_HOSTELS, ...QC_HOSTELS];

// ── Seed function ────────────────────────────────────────────────
const seedHostels = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MONGODB_URI not set in .env");
    }

    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");

    // Clear existing hostels
    await Hostel.deleteMany({});
    console.log("🗑️  Cleared existing hostels");

    // Insert all hostels
    const inserted = await Hostel.insertMany(ALL_HOSTELS);
    console.log(`\n🏨 Seeded ${inserted.length} hostels:`);
    console.log(`   KP hostels: ${KP_HOSTELS.length} (KP-1 to KP-25)`);
    console.log(`   QC hostels: ${QC_HOSTELS.length} (QC-1 to QC-13)`);
    console.log(`   Total: ${inserted.length}\n`);

    // Print all seeded
    inserted.forEach((h) => console.log(`   ✓ ${h.name} (${h.type})`));

    await mongoose.disconnect();
    console.log("\n✅ Done! Database seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedHostels();
