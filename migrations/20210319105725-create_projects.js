'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('projects', 
     { 
       project_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
     },
     project_name: {
       type: Sequelize.STRING,
       allowNull: false
     },
     description: {
      type: Sequelize.STRING,
      allowNull: false
    }, 
    state: {
      type: Sequelize.STRING,
      allowNull: false
    }, 
    city: {
      type: Sequelize.STRING,
      allowNull: false
    },  
    address: {
      type: Sequelize.STRING,
      allowNull: false
    }, 
    status: {
      type: Sequelize.STRING,
      allowNull: false
    }, 
    project_img: {
      type: Sequelize.STRING,
      allowNull: false
    }, 
    start_date: {
      type: Sequelize.DATE,
      allowNull: false
    }, 
    end_date: {
      type: Sequelize.DATE,
      allowNull: false
    }, 
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue : Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue : Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      allowNull: false
    },
   }
     
     );
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
     await queryInterface.dropTable('projects');
  }
};
