export const sendOTP = async (mobile: string, otp: string): Promise<void> => {
  console.log(`[OTP] Sending OTP to ${mobile}: ${otp}`);
  return Promise.resolve();
};
