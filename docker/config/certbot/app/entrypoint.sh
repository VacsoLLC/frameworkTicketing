#!/bin/sh

interruptible_sleep() {
    local duration=$1
    local i=0
    while [ $i -lt $duration ]; do
        sleep 1
        i=$((i + 1))
    done
}

cleanup() {
    echo "Shutting down script..."
    exit 0  # Exit cleanly
}



trap cleanup SIGTERM SIGINT

echo "Certbot starting up...";
sleep 1;
if [ ! -f /certs/$DOMAIN_NAME/fullchain.pem ]; then
    CERT_DIR="/certs/$DOMAIN_NAME";
    mkdir -p $CERT_DIR;
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/$DOMAIN_NAME/privkey.pem -out /certs/$DOMAIN_NAME/fullchain.pem -subj "/CN=$DOMAIN_NAME";
    sleep 1;
    echo "Temporary self-signed certificate generated.";
fi;
echo "Sleeping for 60 seconds...";
#sleep 60; 
interruptible_sleep 60;

if [ ! -f /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem ]; then
    echo "Requesting new cert from Lets Encrypt...";
    certbot certonly -v --webroot --webroot-path /var/www/certbot -d $DOMAIN_NAME --force-renewal --non-interactive --email $CERTBOT_EMAIL --agree-tos --deploy-hook /app/post_hook.sh;
fi;
while :; do 
    echo "Checking if any certs need renewal every 12 hours...";
    certbot renew;
    #sleep 12h; 
    interruptible_sleep 43200;  # 12 hours
done;