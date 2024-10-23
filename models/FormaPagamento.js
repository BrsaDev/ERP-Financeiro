const db = require('./db')

const FormaPagamento = db.sequelize.define('formas_pagamento', {
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

// FormaPagamento.sync({force:true})

module.exports = FormaPagamento
