const db = require('./db')

const Empresa = db.sequelize.define('empresas', {
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

// Empresa.sync({force:true})

module.exports = Empresa

