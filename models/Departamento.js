const db = require('./db')

const Departamento = db.sequelize.define('departamentos', {
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

// Departamento.sync({force:true})

module.exports = Departamento

