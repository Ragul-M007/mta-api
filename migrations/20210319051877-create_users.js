'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.createTable('users',
      {
        user_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        role_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
          references: {
            model: 'user_roles',
            key: 'role_id'
          }
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        email: {
          type: Sequelize.STRING,
          allowNull: false
        },
        mobile_no: {
          type: Sequelize.STRING,
          allowNull: false
        },
        password: {
          type: Sequelize.STRING,
          allowNull: false
        },
        loginpin: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        status: {
          type: Sequelize.STRING,
          allowNull: false
        },
        user_img: {
          type: Sequelize.STRING,
          allowNull: false
        },
        dob: {
          type: Sequelize.DATE,
          allowNull: false
        },
        anniver_date: {
          type: Sequelize.DATE,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue : Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          type: Sequelize.DATE,
          defaultValue : Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
          allowNull: false
        },
      });

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

     await queryInterface.dropTable('users');
  }
};
