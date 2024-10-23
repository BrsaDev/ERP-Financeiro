const db = require('./db')

const TipoChavePix = db.sequelize.define('tipos_chave_pix', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    tipo: {
        type: db.Sequelize.STRING,
        allowNull: false
    }
}, { timestamps: false } )

// TipoChavePix.sync({force:true})

module.exports = TipoChavePix

