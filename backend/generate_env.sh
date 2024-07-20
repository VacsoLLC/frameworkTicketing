#!/bin/bash
# Generates the minimum required variables to start.
# If using the docker compose provided, the random value for the mariadb root user and the framework user will be used.
# If using your own mysql/mariadb server
## The root password is not required.
## Set the MARIADB_PASSWORD to the password for the framework user. 
## Create the core database
## Create databases for any packages 
## Grant the framework user full rights to those databases.


# Generate random passwords using openssl
MARIADB_ROOT_PASSWORD=$(openssl rand -base64 32)
MARIADB_PASSWORD=$(openssl rand -base64 32)
SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=$(openssl rand -base64 32)

# Create or overwrite the .env file
echo "MARIADB_ROOT_PASSWORD=$MARIADB_ROOT_PASSWORD" > .env
echo "MARIADB_PASSWORD=$MARIADB_PASSWORD" >> .env
echo "SECRET=$SECRET" >> .env
echo "ADMIN_PASSWORD=$ADMIN_PASSWORD" >> .env
echo "NODE_ENV=production" >> .env
echo "DOMAIN_NAME=CHANGEME" >> .env
echo "CERTBOT_EMAIL=CHANGEME" >> .env


echo ".env file has been created with random passwords."
