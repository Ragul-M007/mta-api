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

     await queryInterface.addColumn('project_documents', 'created_at', {
       type:Sequelize.DATE,
       allowNull: false,
       defaultValue : Sequelize.literal('CURRENT_TIMESTAMP'),
       before: 'file_name'
     })
     await queryInterface.addColumn('project_documents', 'updated_at', {
      type:Sequelize.DATE,
      allowNull: false,
      defaultValue : Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      before: 'created_at'
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.removeColumn('project_documents', 'created_at')
     await queryInterface.removeColumn('project_documents', 'updated_at')
  }
};
