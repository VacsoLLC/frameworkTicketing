import dotenv from "dotenv";
dotenv.config(); // This line is necessary to load the .env file where your environment variables are defined.

export default {
    baseURL: process.env.FRONTEND_BASE_URL || "https://localhost:5173",
    requiredPasswordStrength: process.env.REQUIRED_PASSWORD_STRENGTH || 3,
}