'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
      await queryInterface.removeColumn('newsfeed', 'title')
                
     await queryInterface.addColumn('newsfeed', 'title_text', {
       type:Sequelize.STRING,
       allowNull: false,
       after: 'id'
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
