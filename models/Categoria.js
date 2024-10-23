const db = require('./db')

const Categoria = db.sequelize.define('categorias', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    subgrupo: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    grupo: {
        type: db.Sequelize.STRING,
        allowNull: false
    }
}, { timestamps: false } )

// Categoria.sync({force:true})

module.exports = Categoria

