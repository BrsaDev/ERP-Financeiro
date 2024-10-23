const db = require('./db')

const Cargo = db.sequelize.define('cargos', {
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

// Cargo.sync({force:true})

module.exports = Cargo

