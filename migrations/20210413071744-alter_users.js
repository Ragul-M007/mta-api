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

     await queryInterface.addColumn('users', 'city', {
       type:Sequelize.STRING,
       allowNull: false,
       after: 'mobile_no'
     })
     await queryInterface.addColumn('users', 'area', {
      type:Sequelize.STRING,
      allowNull: false,
      after: 'city'
    })
    
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    //  await queryInterface.removeColumn('project_documents', 'file_name')
    
  }
};
