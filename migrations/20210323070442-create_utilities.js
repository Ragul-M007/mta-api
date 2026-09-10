'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('utilities', 
     { 
      util_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
     },
     document_id: {
       type: Sequelize.INTEGER,
       allowNull: false,
       onDelete: 'CASCADE',
          onUpdate: 'RESTRICT',
          references: {
            model: 'project_documents',
            key: 'document_id'
          }
     },
     status: {
      type: Sequelize.STRING,
      allowNull: false
    },
    delete_time: {
      type: Sequelize.DATE,
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
     await queryInterface.dropTable('utilities');
  }
};
