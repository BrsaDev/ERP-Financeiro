const db = require('./db')

const Sistema = db.sequelize.define('sistemas', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: db.Sequelize.STRING,
        allowNull: false
    }
}, { timestamps: false } )

// Sistema.sync({force:true})

module.exports = Sistema

