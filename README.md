# sipper-app

# 1.1 Sequelize - For migrations
*******************************

# To create migrations
sequelize migration:create --name create_or_alter_<migrate_name>


# To create migrations
sequelize seed:create --name <seeder_name>


# To run migrations
sequelize db:migrate

sequelize-cli db:migrate --env test && sequelize db:seed:all --env test
# To run seeders
sequelize db:seed:all



# use vs code extensions to get clarity for comments
exodiusstudios.comment-anchors