import jwt from "jsonwebtoken";
import { Types } from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_change_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  tokenVersion: number;
}

/**
 * Generate a signed JWT for a user
 */
export const generateToken = (
  userId: Types.ObjectId,
  tokenVersion: number
): string => {
  return jwt.sign(
    { userId: userId.toString(), tokenVersion },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

/**
 * Verify and decode a JWT
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
