#!/bin/bash

# Generate random passwords using openssl
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32)
MYSQL_PASSWORD=$(openssl rand -base64 32)
SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=$(openssl rand -base64 32)

# Create or overwrite the .env file
echo "MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD" > .env
echo "MYSQL_PASSWORD=$MYSQL_PASSWORD" >> .env
echo "SECRET=$SECRET" >> .env
echo "ADMIN_PASSWORD=$ADMIN_PASSWORD" >> .env


echo ".env file has been created with random passwords."
