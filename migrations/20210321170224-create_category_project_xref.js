'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('category_project_xref', 
     { 
      category_id: {
          type: Sequelize.INTEGER,
     },
     project_id: {
       type: Sequelize.INTEGER,
       allowNull: false,
       onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
          references: {
            model: 'projects',
            key: 'project_id'
          }
     },
     user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      onDelete: 'CASCADE',
      onUpdate: 'RESTRICT',
      references: {
        model: 'users',
        key: 'user_id'
      }
    }
  })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.dropTable('category_project_xref');
  }
};
