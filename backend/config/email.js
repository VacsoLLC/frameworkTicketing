// Using ES6 syntax to import environment variables into your configuration
import dotenv from "dotenv";
dotenv.config(); // This line is necessary to load the .env file where your environment variables are defined.

export default {
  defaultMailbox: process.env.DEFAULT_MAILBOX || "Microsoft", // Loaded from environment
  mailboxes: [
    {
      type: "Microsoft",
      name: "Microsoft",
      email: process.env.MICROSOFT_EMAIL_ADDRESS,
      assignmentGroup: 1, // Sales // TODO change this to names and look up the ID
      auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID, // Loaded from environment
        tenantId: process.env.MICROSOFT_TENANT_ID, // Loaded from environment
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET, // Loaded from environment
      },
      checkInterval: 60 * 1000, // 1 minute
    },
    {
      type: "Google",
      name: "Google",
      email: process.env.GOOGLE_EMAIL_ADDRESS,
      assignmentGroup: 4, // IT Helpdesk
      auth: {
        type: "service_account",
        project_id: process.env.GOOGLE_PROJECT_ID, // Loaded from environment
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID, // Loaded from environment
        clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Loaded from environment
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Loaded from environment, with new lines properly escaped

        client_email: process.env.GOOGLE_CLIENT_EMAIL, // Loaded from environment
        client_id: process.env.GOOGLE_CLIENT_ID, // Loaded from environment
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL, // Loaded from environment
        universe_domain: "googleapis.com",
      },
      checkInterval: 60 * 1000, // 1 minute
    },
  ],
};
