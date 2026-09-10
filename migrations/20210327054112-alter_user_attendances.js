'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
     await queryInterface.removeColumn('user_attendances', 'user_id');
     await queryInterface.addColumn('user_attendances', 'id', {
       type:Sequelize.INTEGER,
       primaryKey: true,
       autoIncrement: true,
       allowNull: false,
       before: 'checkType',
     })
     await queryInterface.addColumn('user_attendances', 'user_id', {
      type:Sequelize.INTEGER,
      onDelete: 'CASCADE',
      onUpdate: 'RESTRICT',
      references: {
        model: 'users',
        key: 'user_id'
      },
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
  
  }
};