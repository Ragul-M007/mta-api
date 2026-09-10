'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    //  await queryInterface.removeColumn('otp_verification', 'id')

     await queryInterface.addColumn('otp_verification', 'id', {
       type:Sequelize.INTEGER,
       primaryKey: true,
       autoIncrement: true,
       allowNull: false,
       before: 'email_id'
     })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.removeColumn('otp_verification', 'id')
  }
};
