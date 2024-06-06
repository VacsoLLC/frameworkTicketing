Sample docker compose for production use.

Provides nightly MariaDB full backups. Keeps 7 days.
Creates a self signed SSL certificate.
If possible, obtains a Let's Encrypt SSL cert and automatically renews. Replaces the self signed certificate if successful.

