import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import readline from "readline";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const clearDb = async (): Promise<void> => {
  rl.question(
    '\n⚠️  WARNING: This will DELETE all data in the database.\nType "YES" to confirm: ',
    async (answer) => {
      rl.close();
      if (answer.trim() !== "YES") {
        console.log("❌ Cancelled. Database was NOT cleared.");
        process.exit(0);
      }

      try {
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) throw new Error("MONGODB_URI not set in .env");

        await mongoose.connect(mongoURI);
        console.log("\n✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        if (!db) throw new Error("No database connection");

        const collections = await db.listCollections().toArray();
        for (const col of collections) {
          await db.collection(col.name).deleteMany({});
          console.log(`   🗑️  Cleared: ${col.name}`);
        }

        console.log("\n✅ All collections cleared successfully.\n");
        await mongoose.disconnect();
        process.exit(0);
      } catch (error) {
        console.error("❌ Clear failed:", error);
        process.exit(1);
      }
    }
  );
};

clearDb();
