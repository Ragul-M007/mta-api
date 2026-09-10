'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('comments', 
     { 
      comment_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
     },
     parent_comment_id: {
       type: Sequelize.INTEGER,
      //  allowNull: false
     },
     document_id: {
      type: Sequelize.INTEGER,
      onDelete: 'CASCADE',
      onUpdate: 'RESTRICT',
      references: {
        model: 'project_documents',
        key: 'document_id'
      }
      // allowNull: false
    },
    user_id: {
      type: Sequelize.INTEGER,
      // allowNull: false
      onDelete: 'CASCADE',
      onUpdate: 'RESTRICT',
      references: {
        model: 'users',
        key: 'user_id'
      }
    },
    comment_type: {
      type: Sequelize.STRING,
      // allowNull: false
    },
    comment: {
      type: Sequelize.STRING,
      // allowNull: false
    },
    date: {
      type: Sequelize.DATE,
      // allowNull: false
      defaultValue : Sequelize.literal('CURRENT_TIMESTAMP'),
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
     await queryInterface.dropTable('comments');
  }
};
