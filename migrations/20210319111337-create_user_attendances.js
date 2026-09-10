'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('user_attendances', 
     { 
       user_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
          references: {
            model: 'users',
            key: 'user_id'
          }
     },
     check: {
       type: Sequelize.STRING,
       allowNull: false
     },
     latLng: {
      type: Sequelize.STRING,
      allowNull: false
    },
    location_name: {
      type: Sequelize.STRING,
      allowNull: false
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
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.dropTable('projects');
  }
};
