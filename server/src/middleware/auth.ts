import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token";
import User, { IUser } from "../models/User";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify and decode
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
      return;
    }

    // 3. Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    // 4. Check tokenVersion (invalidates all old tokens on logout/password change)
    if (user.tokenVersion !== decoded.tokenVersion) {
      res.status(401).json({ success: false, message: "Token has been invalidated. Please log in again." });
      return;
    }

    // 5. Check user is verified
    if (!user.isVerified) {
      res.status(403).json({ success: false, message: "Account not verified" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error in auth middleware" });
  }
};
