import dotenv from "dotenv";
dotenv.config(); // This line is necessary to load the .env file where your environment variables are defined.

export default {
    enabled: process.env.SIGNUP_ENABLED || true,
    expiryInHours: process.env.SIGNUP_LINK_EXPIRY_IN_HOURS || 24,
    allowedDomains: (process.env.ALLOWED_EMAIL_DOMAINS ?? '').split(',')
}