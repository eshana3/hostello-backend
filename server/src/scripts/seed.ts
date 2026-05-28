import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { User } from "../models/User.model";
import Hostel from "../models/Hostel";
import Product from "../models/Product";
import Chat from "../models/Chat";
import PollRequest from "../models/PollRequest";
import Notification from "../models/Notification";

// ── helpers ──────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// ── data ─────────────────────────────────────────────────────────
const CATEGORIES = [
  "Electronics",
  "Clothes",
  "Snacks",
  "Accessories",
  "Books",
  "Daily essentials",
] as const;

const CONDITIONS = ["new", "used"] as const;

const PRODUCT_DATA = [
  // Electronics
  { title: "JBL Flip 5 Bluetooth Speaker", category: "Electronics", price: 1800, condition: "used" },
  { title: "Boat Rockerz 255 Earphones", category: "Electronics", price: 600, condition: "used" },
  { title: "Mi Power Bank 10000mAh", category: "Electronics", price: 700, condition: "used" },
  { title: "HP USB Mouse", category: "Electronics", price: 250, condition: "used" },
  { title: "Realme Buds Air 3 Neo", category: "Electronics", price: 900, condition: "new" },
  { title: "Laptop Stand Adjustable", category: "Electronics", price: 450, condition: "used" },
  { title: "USB-C Hub 7-in-1", category: "Electronics", price: 550, condition: "new" },
  { title: "Noise ColorFit Pro Smartwatch", category: "Electronics", price: 1200, condition: "used" },
  { title: "Keyboard Mechanical Compact", category: "Electronics", price: 1500, condition: "new" },
  { title: "Ring Light 10 inch with Tripod", category: "Electronics", price: 800, condition: "used" },
  // Books
  { title: "NCERT Chemistry Part 1 & 2", category: "Books", price: 100, condition: "used" },
  { title: "Data Structures by Narasimha Karumanchi", category: "Books", price: 200, condition: "used" },
  { title: "Let Us C by Yashavant Kanetkar", category: "Books", price: 80, condition: "used" },
  { title: "Operating Systems by Galvin", category: "Books", price: 250, condition: "used" },
  { title: "DBMS by Ramakrishnan", category: "Books", price: 220, condition: "used" },
  { title: "Engineering Mathematics by B.S. Grewal", category: "Books", price: 300, condition: "used" },
  { title: "The Alchemist - Paulo Coelho", category: "Books", price: 50, condition: "used" },
  { title: "Atomic Habits - James Clear", category: "Books", price: 120, condition: "new" },
  { title: "GATE CSE Previous Papers", category: "Books", price: 180, condition: "used" },
  { title: "Competitive Programming Handbook", category: "Books", price: 160, condition: "used" },
  // Clothes
  { title: "Nike Dri-Fit T-Shirt (L)", category: "Clothes", price: 350, condition: "used" },
  { title: "Adidas Track Pants Black (M)", category: "Clothes", price: 400, condition: "used" },
  { title: "Hoodie Grey Unisex (XL)", category: "Clothes", price: 500, condition: "used" },
  { title: "Puma Running Shoes Size 9", category: "Clothes", price: 800, condition: "used" },
  { title: "Formal Shirt White (40)", category: "Clothes", price: 300, condition: "new" },
  { title: "Cargo Shorts Khaki (32)", category: "Clothes", price: 350, condition: "used" },
  { title: "Winter Jacket Navy Blue (L)", category: "Clothes", price: 700, condition: "used" },
  { title: "Sports Socks Pack of 6", category: "Clothes", price: 120, condition: "new" },
  // Snacks & Daily
  { title: "Instant Oats 1kg Pack", category: "Snacks", price: 90, condition: "new" },
  { title: "Protein Bar Box (12 bars)", category: "Snacks", price: 350, condition: "new" },
  { title: "Peanut Butter Crunchy 500g", category: "Snacks", price: 180, condition: "new" },
  { title: "Green Tea 100 Bags Tetley", category: "Snacks", price: 120, condition: "new" },
  { title: "Maggi Instant Noodles 12-pack", category: "Snacks", price: 100, condition: "new" },
  { title: "Multivitamin Tablets 60-count", category: "Daily essentials", price: 250, condition: "new" },
  { title: "Dettol Hand Sanitizer 500ml", category: "Daily essentials", price: 120, condition: "new" },
  { title: "Laundry Detergent Surf Excel 1kg", category: "Daily essentials", price: 130, condition: "new" },
  { title: "Toothbrush Pack of 4 Oral-B", category: "Daily essentials", price: 80, condition: "new" },
  { title: "Shampoo Head & Shoulders 400ml", category: "Daily essentials", price: 150, condition: "new" },
  // Accessories
  { title: "Laptop Bag 15.6 inch Backpack", category: "Accessories", price: 600, condition: "used" },
  { title: "Water Bottle Stainless 1L", category: "Accessories", price: 250, condition: "used" },
  { title: "Phone Case iPhone 13 Clear", category: "Accessories", price: 80, condition: "new" },
  { title: "Tiffin Box 3-tier Steel", category: "Accessories", price: 200, condition: "used" },
  { title: "Extension Board 4-socket 2m", category: "Accessories", price: 300, condition: "used" },
  { title: "Wall Clock Simple White", category: "Accessories", price: 150, condition: "used" },
  { title: "Study Lamp LED Adjustable", category: "Accessories", price: 350, condition: "used" },
  { title: "Whiteboard A3 with Markers", category: "Accessories", price: 400, condition: "new" },
  { title: "Padlock Combination 3-digit", category: "Accessories", price: 90, condition: "new" },
  { title: "Umbrella Compact Auto-open", category: "Accessories", price: 200, condition: "used" },
  { title: "Clothes Drying Stand Foldable", category: "Accessories", price: 450, condition: "used" },
  { title: "Dustbin 10L with Lid", category: "Accessories", price: 120, condition: "new" },
];

const DESCRIPTIONS: Record<string, string> = {
  Electronics: "Works perfectly. Barely used. All accessories included. No scratches or dents. Selling because I upgraded.",
  Books: "Good condition. Some pencil marks inside but all pages intact. Very helpful for exams. Selling since course is done.",
  Clothes: "Worn only a few times. Washed and clean. Good condition. Selling because it doesn't fit anymore.",
  Snacks: "Sealed pack, fresh stock. Bought in bulk, selling extras. Check expiry before purchase.",
  "Daily essentials": "Sealed/unused. Extra stock from bulk purchase. Genuine product.",
  Accessories: "Used but good condition. Works as intended. Minor wear is normal. Great for hostel use.",
};

const POLL_ITEMS = [
  { itemName: "Scientific Calculator Casio FX-991ES", category: "Electronics", maxPrice: 800 },
  { itemName: "GATE 2025 Study Material Complete Set", category: "Books", maxPrice: 600 },
  { itemName: "Protein Powder Whey 1kg", category: "Snacks", maxPrice: 1200 },
  { itemName: "Laptop Cooling Pad", category: "Electronics", maxPrice: 700 },
  { itemName: "Raincoat / Poncho", category: "Clothes", maxPrice: 400 },
  { itemName: "Induction Cooktop", category: "Daily essentials", maxPrice: 1500 },
  { itemName: "Skipping Rope Sports", category: "Accessories", maxPrice: 200 },
  { itemName: "Thermometer Digital", category: "Daily essentials", maxPrice: 300 },
  { itemName: "Mini Fridge 20L", category: "Electronics", maxPrice: 3000 },
  { itemName: "Printer Portable Bluetooth", category: "Electronics", maxPrice: 2500 },
];

// ── main seed ─────────────────────────────────────────────────────
const seed = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error("MONGODB_URI not set in .env");

    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB\n");

    // ── 1. Hostels ──
    console.log("🏨 Seeding hostels...");
    await Hostel.deleteMany({});
    const hostelDocs = await Hostel.insertMany([
      ...Array.from({ length: 25 }, (_, i) => ({ name: `KP-${i + 1}`, type: "KP", number: i + 1 })),
      ...Array.from({ length: 13 }, (_, i) => ({ name: `QC-${i + 1}`, type: "QC", number: i + 1 })),
    ]);
    console.log(`   ✓ ${hostelDocs.length} hostels seeded\n`);

    // ── 2. Users ──
    console.log("👤 Seeding users...");
    await User.deleteMany({});
    const userData = [
      { mobile: "9000000001", name: "Eshana Singh", email: "eshanasingh03@gmail.com", role: "student", isVerified: true },
      { mobile: "9000000002", name: "Admin User", email: "admin@hostelhubu.com", role: "hostelOwner", isVerified: true },
      { mobile: "9000000003", name: "Rahul Kumar", email: "rahul.kumar@example.com", role: "student", isVerified: true },
      { mobile: "9000000004", name: "Priya Sharma", email: "priya.sharma@example.com", role: "student", isVerified: true },
      { mobile: "9000000005", name: "Arjun Singh", email: "arjun.singh@example.com", role: "student", isVerified: true },
      { mobile: "9000000006", name: "Neha Gupta", email: "neha.gupta@example.com", role: "student", isVerified: true },
      { mobile: "9000000007", name: "Vikram Patel", email: "vikram.patel@example.com", role: "student", isVerified: true },
      { mobile: "9000000008", name: "Anjali Mehta", email: "anjali.mehta@example.com", role: "student", isVerified: true },
      { mobile: "9000000009", name: "Rohan Das", email: "rohan.das@example.com", role: "student", isVerified: true },
      { mobile: "9000000010", name: "Divya Nair", email: "divya.nair@example.com", role: "student", isVerified: true },
      { mobile: "9000000011", name: "Kartik Joshi", email: "kartik.joshi@example.com", role: "student", isVerified: true },
      { mobile: "9000000012", name: "Sakshi Rao", email: "sakshi.rao@example.com", role: "student", isVerified: true },
      { mobile: "9000000013", name: "Aditya Verma", email: "aditya.verma@example.com", role: "student", isVerified: true },
      { mobile: "9000000014", name: "Meera Pillai", email: "meera.pillai@example.com", role: "student", isVerified: true },
      { mobile: "9000000015", name: "Siddharth Roy", email: "siddharth.roy@example.com", role: "student", isVerified: true },
      { mobile: "9000000016", name: "Pooja Tiwari", email: "pooja.tiwari@example.com", role: "student", isVerified: true },
      { mobile: "9000000017", name: "Harsh Malhotra", email: "harsh.malhotra@example.com", role: "student", isVerified: true },
      { mobile: "9000000018", name: "Ritika Bansal", email: "ritika.bansal@example.com", role: "student", isVerified: true },
      { mobile: "9000000019", name: "Manish Yadav", email: "manish.yadav@example.com", role: "student", isVerified: true },
      { mobile: "9000000020", name: "Tanvi Chawla", email: "tanvi.chawla@example.com", role: "student", isVerified: true },
    ];
    const userDocs = await User.insertMany(userData);
    console.log(`   ✓ ${userDocs.length} users seeded\n`);

    // ── 3. Products ──
    console.log("📦 Seeding products...");
    await Product.deleteMany({});
    const productInserts = PRODUCT_DATA.map((p, i) => ({
      title: p.title,
      description: DESCRIPTIONS[p.category] || "Good condition item. Selling from hostel room.",
      price: p.price,
      category: p.category,
      condition: p.condition,
      negotiable: i % 3 === 0,
      images: [
        { url: `https://picsum.photos/400/400?random=${i + 1}`, public_id: `seed_product_${i + 1}` },
      ],
      hostel: hostelDocs[i % hostelDocs.length]._id,
      seller: userDocs[(i % (userDocs.length - 2)) + 2]._id, // skip first 2 (eshana + admin) as default sellers
      status: i % 10 === 0 ? "sold" : "active",
      views: rand(0, 120),
    }));
    const productDocs = await Product.insertMany(productInserts);
    console.log(`   ✓ ${productDocs.length} products seeded\n`);

    // ── 4. Chats ──
    console.log("💬 Seeding chats...");
    await Chat.deleteMany({});
    const chatData = productDocs.slice(0, 6).map((product, i) => {
      const buyer = userDocs[i % userDocs.length];
      const seller = userDocs[(i + 3) % userDocs.length];
      const now = new Date();
      return {
        participants: [buyer._id, seller._id],
        product: product._id,
        messages: [
          {
            sender: buyer._id,
            text: `Hi, is ${product.title} still available?`,
            timestamp: new Date(now.getTime() - 1000 * 60 * 30),
            read: true,
          },
          {
            sender: seller._id,
            text: "Yes, it's available! Come to my room any time.",
            timestamp: new Date(now.getTime() - 1000 * 60 * 25),
            read: true,
          },
          {
            sender: buyer._id,
            text: `Can you do ₹${product.price - 50}?`,
            timestamp: new Date(now.getTime() - 1000 * 60 * 20),
            read: true,
          },
          {
            sender: seller._id,
            text: "Sure, I can do that. When can you pick it up?",
            timestamp: new Date(now.getTime() - 1000 * 60 * 10),
            read: false,
          },
          {
            sender: buyer._id,
            text: "I'll come by after 6 PM today!",
            timestamp: new Date(now.getTime() - 1000 * 60 * 5),
            read: false,
          },
        ],
      };
    });
    const chatDocs = await Chat.insertMany(chatData);
    console.log(`   ✓ ${chatDocs.length} chats seeded\n`);

    // ── 5. Polls ──
    console.log("📋 Seeding poll requests...");
    await PollRequest.deleteMany({});
    const pollData = POLL_ITEMS.map((item, i) => {
      const buyer = userDocs[i % userDocs.length];
      const replier1 = userDocs[(i + 2) % userDocs.length];
      const replier2 = userDocs[(i + 4) % userDocs.length];
      return {
        buyer: buyer._id,
        itemName: item.itemName,
        description: `Looking for ${item.itemName} in good condition. Need it urgently. Please reply if you have one to sell.`,
        category: item.category,
        maxPrice: item.maxPrice,
        hostel: hostelDocs[i % hostelDocs.length]._id,
        status: i < 8 ? "open" : "closed",
        replies:
          i % 3 !== 0
            ? [
                {
                  seller: replier1._id,
                  message: `I have one! Check my listing or DM me. Price is around ₹${item.maxPrice - 100}.`,
                  createdAt: new Date(Date.now() - 1000 * 60 * 60 * rand(1, 48)),
                },
                {
                  seller: replier2._id,
                  message: `I can arrange this for you. Mine is in excellent condition.`,
                  createdAt: new Date(Date.now() - 1000 * 60 * 60 * rand(1, 24)),
                },
              ]
            : [],
      };
    });
    const pollDocs = await PollRequest.insertMany(pollData);
    console.log(`   ✓ ${pollDocs.length} polls seeded\n`);

    // ── 6. Notifications ──
    console.log("🔔 Seeding notifications...");
    await Notification.deleteMany({});
    const notifData = [
      // for eshana (userDocs[0])
      { recipient: userDocs[0]._id, type: "new_message", message: "Rahul Kumar sent you a message about your listing.", isRead: false, reference: String(chatDocs[0]?._id) },
      { recipient: userDocs[0]._id, type: "interested_buyer", message: "Someone is interested in your Laptop Stand listing.", isRead: false, reference: String(productDocs[5]?._id) },
      { recipient: userDocs[0]._id, type: "product_sold", message: "Congratulations! Your JBL Speaker has been marked as sold.", isRead: true, reference: String(productDocs[0]?._id) },
      { recipient: userDocs[0]._id, type: "poll_reply", message: "Priya replied to your poll request for Scientific Calculator.", isRead: false, reference: String(pollDocs[0]?._id) },
      { recipient: userDocs[0]._id, type: "general", message: "Welcome to HostelHub! Start browsing listings in your hostel.", isRead: true },
      // for other users
      { recipient: userDocs[2]._id, type: "new_message", message: "Eshana sent you a message about Books.", isRead: false, reference: String(chatDocs[1]?._id) },
      { recipient: userDocs[3]._id, type: "poll_reply", message: "Someone replied to your poll for Protein Powder.", isRead: false, reference: String(pollDocs[2]?._id) },
      { recipient: userDocs[4]._id, type: "interested_buyer", message: "A buyer is interested in your Realme Buds listing.", isRead: true, reference: String(productDocs[4]?._id) },
      { recipient: userDocs[5]._id, type: "product_sold", message: "Your Laptop Bag has been sold!", isRead: false, reference: String(productDocs[39]?._id) },
      { recipient: userDocs[2]._id, type: "product_removed", message: "Your listing for Maggi Noodles was removed by admin.", isRead: true, reference: String(productDocs[32]?._id) },
      { recipient: userDocs[3]._id, type: "general", message: "Your account has been verified. You can now post listings.", isRead: true },
      { recipient: userDocs[0]._id, type: "new_message", message: "Vikram Patel is asking about the Hoodie you listed.", isRead: false, reference: String(chatDocs[2]?._id) },
    ];
    await Notification.insertMany(notifData);
    console.log(`   ✓ ${notifData.length} notifications seeded\n`);

    // ── Summary ──
    console.log("═══════════════════════════════════════");
    console.log("✅  Database seeded successfully!");
    console.log("═══════════════════════════════════════");
    console.log(`   🏨  Hostels    : ${hostelDocs.length}`);
    console.log(`   👤  Users      : ${userDocs.length}`);
    console.log(`   📦  Products   : ${productDocs.length}`);
    console.log(`   💬  Chats      : ${chatDocs.length}`);
    console.log(`   📋  Polls      : ${pollDocs.length}`);
    console.log(`   🔔  Notifs     : ${notifData.length}`);
    console.log("───────────────────────────────────────");
    console.log("   Test mobile numbers: 9000000001 – 9000000020");
    console.log("   Use OTP login in the app to test.");
    console.log("═══════════════════════════════════════\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seed();
