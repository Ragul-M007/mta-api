'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('special_file_access', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'available_categories',
          key: 'category_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'RESTRICT'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('special_file_access', ['user_id']);
    await queryInterface.addIndex('special_file_access', ['category_id']);
    await queryInterface.addIndex('special_file_access', ['user_id', 'category_id'], {
      unique: true,
      name: 'uq_special_file_access_user_category'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('special_file_access');
  }
};