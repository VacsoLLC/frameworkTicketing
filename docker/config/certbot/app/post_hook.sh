#!/bin/sh

# Copy the certificate and key to the new location
cp /etc/letsencrypt/live/$DOMAIN_NAME/* /certs/$DOMAIN_NAME/


echo "Certificates copied for $DOMAIN_NAME to /certs. Restarting Nginx...";

/bin/sh /app/restartnginx.sh
