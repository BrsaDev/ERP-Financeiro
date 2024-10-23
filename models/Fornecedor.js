const db = require('./db')

const Fornecedor = db.sequelize.define('fornecedores', {
    id:                     { type: db.Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    nome:                   { type: db.Sequelize.STRING },
    chave:                  { type: db.Sequelize.STRING },
    via_pagamento:          { type: db.Sequelize.STRING },
    data_cadastro:          { type: db.Sequelize.STRING },
    nome_fantasia:          { type: db.Sequelize.STRING },
    informacao:             { type: db.Sequelize.STRING },
    endereco:               { type: db.Sequelize.STRING },
    bairro:                 { type: db.Sequelize.STRING },
    cidade:                 { type: db.Sequelize.STRING },
    estado:                 { type: db.Sequelize.STRING },
    cep:                    { type: db.Sequelize.STRING },
    cnpj:                   { type: db.Sequelize.STRING },
    insc_estadual:          { type: db.Sequelize.STRING },
    telefone:               { type: db.Sequelize.STRING },
    site:                   { type: db.Sequelize.STRING },
    ramo:                   { type: db.Sequelize.STRING },
    nome_contato:           { type: db.Sequelize.STRING },
    endereco_contato:       { type: db.Sequelize.STRING },
    cidade_contato:         { type: db.Sequelize.STRING },
    estado_contato:         { type: db.Sequelize.STRING },
    telefone_cel_contato:   { type: db.Sequelize.STRING },
    telefone_fixo_contato:  { type: db.Sequelize.STRING },
    observacao:             { type: db.Sequelize.STRING },
}, { timestamps: false } )

// Fornecedor.sync({force:true})

module.exports = Fornecedor

