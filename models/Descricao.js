const db = require('./db')

const Descricao = db.sequelize.define('descricoes', {
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

// Descricao.sync({force:true})

module.exports = Descricao

