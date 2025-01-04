import dotenv from "dotenv";
dotenv.config(); // This line is necessary to load the .env file where your environment variables are defined.

export default {
    isEnabled: process.env.SIGNUP_ENABLED || true,
    expiryInHours: process.env.SIGNUP_LINK_EXPIRY_IN_HOURS || 24
}