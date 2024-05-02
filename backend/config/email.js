export default {
  defaultMailbox: "Google",
  mailboxes: [
    {
      type: "Microsoft",
      name: "Microsoft",
      email: "tripp@hivemindlegal.com",
      assignmentGroup: 1, // Sales // TODO change this to names and look up the ID
      auth: {
        clientId: "", // FIXME get from enviorment
        tenantId: "", // FIXME get from enviorment
        clientSecret: "", // FIXME get from enviorment
      },
      checkInterval: 60 * 1000, // 1 minute
    },
    {
      type: "Google",
      name: "Google",
      email: "support@wasteoftime.org",
      assignmentGroup: 4, // IT Helpdesk
      auth: {
        type: "service_account",
        project_id: "", // FIXME get from enviorment
        private_key_id: "", // FIXME get from enviorment
        clientSecret: "", // FIXME get from enviorment
        private_key: "", // FIXME get from enviorment

        client_email: "", // FIXME get from enviorment
        client_id: "", // FIXME get from enviorment
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url:
          "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "", // FIXME get from enviorment
        universe_domain: "googleapis.com",
      },
      checkInterval: 60 * 1000, // 1 minute
    },
  ],
};
