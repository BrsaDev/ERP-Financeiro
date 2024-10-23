const db = require('./db')

const Banco = db.sequelize.define('bancos', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    agencia: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    conta_corrente: {
        type: db.Sequelize.STRING,
        allowNull: false
    }
}, { timestamps: false } )

// Banco.sync({force:true})

module.exports = Banco

