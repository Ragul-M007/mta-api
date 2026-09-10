#!/usr/bin/env bash
MYSQL_HOST=$(grep DB_HOST .env | xargs| cut -d "=" -f2)
MYSQL_PORT=3306
MYSQL_USER=$(grep DB_USER .env | xargs| cut -d "=" -f2)
MYSQL_PASSWORD=$(grep DB_PASS .env | xargs| cut -d "=" -f2)
DB=$(grep DB_NAME .env | xargs| cut -d "=" -f2)

# sequelize --options-path ./.sequelizerc-institution db:migrate --url "mysql://$MYSQL_USER:$MYSQL_PASSWORD@$MYSQL_HOST:$MYSQL_PORT/$DB"
echo "$DB"
 if sequelize --options-path ./.sequelizerc db:migrate --url "mysql://$MYSQL_USER:$MYSQL_PASSWORD@$MYSQL_HOST:$MYSQL_PORT/$DB"; then
 echo "Migration succeed on $DB"
 fi