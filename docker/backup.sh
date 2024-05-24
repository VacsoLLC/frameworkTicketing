#!/bin/bash

# Filename to save the backup
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="/backup/mariadb-backup-$DATE.sql.gz"

# Dump the database and compress it with gzip
echo "Creating backup file $BACKUP_FILE"
mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" --all-databases | gzip > "$BACKUP_FILE"

# Remove backup files older than 7 days
find /backup -name 'mariadb-backup-*.sql.gz' -mtime +7 -exec rm {} \;
