const { Sequelize } = require('sequelize')

const sequelize = new Sequelize('erp_financeiro', 'root', '', {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    logging: false
});

module.exports = {
    Sequelize: Sequelize,
    sequelize: sequelize
}
