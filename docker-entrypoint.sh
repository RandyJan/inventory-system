#!/bin/sh
set -e

# Disable SSL verification for the mysql CLI client.
# MYSQL_ATTR_SSL_CA in .env only affects PHP PDO, not the mysql binary
# used by Laravel's schema loader. This prevents the "self-signed certificate
# in certificate chain" error (ERROR 2026) when loading mysql-schema.sql.
printf '[client]\nssl=false\n' > ~/.my.cnf

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "Running database migrations..."
  php artisan migrate --force

  # echo "Waiting for containers to be ready..."
  # sleep 5

  # echo "Optimizing application..."
  # php artisan optimize
fi

exec "$@"
