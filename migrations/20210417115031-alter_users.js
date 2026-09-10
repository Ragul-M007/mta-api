'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
      // await queryInterface.removeColumn('users', 'title')

     await queryInterface.addColumn('users', 'state', {
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
