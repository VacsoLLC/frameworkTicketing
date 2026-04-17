import dotenv from "dotenv";
dotenv.config(); // This line is necessary to load the .env file where your environment variables are defined.

export default {
    // This is in minutes
    expiryTime: process.env.FORGOT_PASSWORD_EXPIRY_TIME || 60, // 1 hour,
    enabled: process.env.FORGOT_PASSWORD_ENABLED !== "false",
}