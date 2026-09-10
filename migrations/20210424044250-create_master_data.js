'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('master_data', 
     { 
     
     duration: {
       type: Sequelize.INTEGER,
       allowNull: false,
     },
     duration_type: {
      type: Sequelize.STRING,
      allowNull: false
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
     await queryInterface.dropTable('master_data');
  }
};
