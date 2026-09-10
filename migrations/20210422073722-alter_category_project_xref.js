'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
       await queryInterface.removeColumn('category_project_xref', 'project_role')

     await queryInterface.addColumn('category_project_xref', 'project_role', {
       type:Sequelize.STRING,
       allowNull: true,
       after: 'project_id'
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
