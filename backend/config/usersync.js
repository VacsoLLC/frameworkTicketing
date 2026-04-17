export default {
  tenantId: process.env.MICROSOFT_TENANT_ID,
  clientId: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  enabled: process.env.SYNC_USERS === "1",
  syncInterval: 60 * 60 * 6 * 1000, // 6 hours
};
