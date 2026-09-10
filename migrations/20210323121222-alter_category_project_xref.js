'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.removeColumn('category_project_xref', 'user_id');

     await queryInterface.addColumn('category_project_xref', 'user_id', {
       type:Sequelize.INTEGER,
       after: 'category_id'
     })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.removeColumn('category_project_xref', 'user_id');
  }
};
