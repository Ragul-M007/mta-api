'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.removeColumn('user_attendances', 'check');

     await queryInterface.addColumn('user_attendances', 'checkType', {
       type:Sequelize.STRING,
       after: 'user_id'
     })
     await queryInterface.addColumn('user_attendances', 'checkTime', {
      type:Sequelize.STRING,
      after: 'checkType'
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.removeColumn('user_attendances', 'checkType');
     await queryInterface.removeColumn('user_attendances', 'checkTime');
  }
};