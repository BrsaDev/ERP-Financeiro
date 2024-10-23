const db = require('./db')

const PaginaHome = db.sequelize.define('pagina_home', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    usuario: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    campo: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    href: {
        type: db.Sequelize.STRING,
        allowNull: false
    }
}, { timestamps: false } )

// PaginaHome.sync({force:true})

module.exports = PaginaHome

