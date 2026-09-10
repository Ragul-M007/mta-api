'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.createTable('user_devices', 
     { 
       user_id: {
       type: Sequelize.INTEGER,
       allowNull: false
     },
     device_token: {
       type: Sequelize.STRING,
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
     await queryInterface.dropTable('user_devices');
  }
};
