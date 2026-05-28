import crypto from "crypto";

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash an OTP using SHA-256 before storing in DB
 */
export const hashOTP = (otp: string): string => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Compare a plain OTP with a stored hash
 */
export const verifyOTPHash = (plainOTP: string, hashedOTP: string): boolean => {
  const hash = hashOTP(plainOTP);
  return hash === hashedOTP;
};

/**
 * OTP expiry: 5 minutes from now
 */
export const getOTPExpiry = (): Date => {
  return new Date(Date.now() + 5 * 60 * 1000);
};

/**
 * Send OTP via Fast2SMS (real SMS for India).
 * Falls back to console.log in development if FAST2SMS_API_KEY is not set.
 *
 * Get your free API key at: https://fast2sms.com
 * Add to .env: FAST2SMS_API_KEY=your_key_here
 */
export const sendOTP = async (mobile: string, otp: string): Promise<void> => {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    // No key — log to console (development / testing)
    console.log(`\n📱 ==========================================`);
    console.log(`   OTP for ${mobile}: ${otp}`);
    console.log(`   (Set FAST2SMS_API_KEY in .env to send real SMS)`);
    console.log(`==========================================\n`);
    return;
  }

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "q",
      message: `Your Hostello OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`,
      language: "english",
      flash: 0,
      numbers: mobile,
    }),
  });

  const data = await response.json() as { return: boolean; message: string | string[]; request_id?: string };

  console.log("[Fast2SMS] Response:", JSON.stringify(data));

  if (!data.return) {
    console.error("[Fast2SMS] Failed to send OTP:", data.message);
    throw new Error("Failed to send OTP via SMS. Please try again.");
  }

  console.log(`[Fast2SMS] OTP sent successfully to ${mobile}, request_id: ${data.request_id}`);
};
