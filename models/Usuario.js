const db = require('./db')

const Usuario = db.sequelize.define('usuarios', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: { 
        type: db.Sequelize.STRING ,
        allowNull: false
    },
    sexo: { 
        type: db.Sequelize.STRING ,
        allowNull: false
    },
    nascimento: { 
        type: db.Sequelize.DATE ,
        allowNull: false
    },
    cargo: { 
        type: db.Sequelize.STRING ,
        allowNull: false
    },
    eAdmin: { 
        type: db.Sequelize.BOOLEAN,
        allowNull: false
    },
    telefone: { 
        type: db.Sequelize.STRING ,
        allowNull: false
    },
    whatsapp: { 
        type: db.Sequelize.STRING
    },
    nickname: { 
        type: db.Sequelize.STRING ,
        allowNull: false
    },
    email: { 
        type: db.Sequelize.STRING ,
        allowNull: false
    },
    senha: { 
        type: db.Sequelize.STRING ,
        allowNull: false
    },
    id_empresa_padrao: { 
        type: db.Sequelize.INTEGER ,
        allowNull: false
    },
    nome_empresa_padrao: { 
        type: db.Sequelize.STRING ,
        allowNull: false
    },
    status: { 
        type: db.Sequelize.STRING ,
        allowNull: false
    }
}, { timestamps: false })

// Usuario.sync({force:true}) // depois de executado uma vez, excluir pra não ficar criando nova tabela e excluindo os dados

module.exports = Usuario
