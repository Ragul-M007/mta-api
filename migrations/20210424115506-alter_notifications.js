'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
       await queryInterface.addColumn('notifications', 'user_id', {
       type:Sequelize.INTEGER,
       allowNull: true,
       after: 'noti_type'
     })
      await queryInterface.addColumn('notifications', 'user_type', {
       type:Sequelize.INTEGER,
       allowNull: true,
       after: 'user_id'
     })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
