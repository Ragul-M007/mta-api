'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.removeColumn('utilities', 'delete_time');

     await queryInterface.addColumn('utilities', 'delete_time', {
       type:Sequelize.DATE,
       allowNull: false,
       defaultValue : Sequelize.literal('CURRENT_TIMESTAMP'),
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