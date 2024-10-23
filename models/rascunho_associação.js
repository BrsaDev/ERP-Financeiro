const db = require('./db')

const PlanoConta = db.sequelize.define('plano_contas', {
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

const Grupo = db.sequelize.define('grupos', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: db.Sequelize.STRING,
        allowNull: false
    }
    // subgrupoId: {
    //     type: db.Sequelize.INTEGER,
    //     references: {
    //         model: 'subgrupos',
    //         key: 'id'
    //     }
    // }
      
}, { timestamps: false })

const SubGrupo = db.sequelize.define('subgrupos', {
    id: {
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: db.Sequelize.STRING,
        allowNull: false
    }
    // grupoId: {
    //     type: db.Sequelize.INTEGER,
    //     references: {
    //         model: 'grupos',
    //         key: 'id'
    //     }
    // }
}, { timestamps: false })

PlanoConta.belongsTo(Grupo, {constraint: true});
SubGrupo.belongsTo(Grupo, {constraint: true});
Grupo.hasMany(SubGrupo);
Grupo.hasMany(PlanoConta);
PlanoConta.belongsTo(SubGrupo, {constraint: true});
SubGrupo.hasMany(PlanoConta);

// db.sequelize.sync({force:true})

// module.exports = { PlanoConta, Grupo, SubGrupo }

