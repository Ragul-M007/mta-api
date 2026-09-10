'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
      await queryInterface.removeColumn('comments', 'recipient_id')
       await queryInterface.addColumn('comments', 'recipient_id', {
       type:Sequelize.STRING,
       allowNull: true,
       before: 'recipient'
     })
     await queryInterface.addColumn('comments', 'category_id_list', {
      type:Sequelize.STRING,
      allowNull: true,
      after: 'recipient'
    })
    await queryInterface.addColumn('comments', 'category_list', {
      type:Sequelize.STRING,
      allowNull: true,
      after: 'category_id_list'
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
