'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('project_documents', 
     { 
      document_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
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
     category_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
          references: {
            model: 'available_categories',
            key: 'category_id'
          }
    },
     file: {
      type: Sequelize.STRING,
      allowNull: false
    },
    file_name: {
      type: Sequelize.STRING,
      allowNull: false
    },
  })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.dropTable('project_documents');
  }
};
