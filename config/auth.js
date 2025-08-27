const localStrategy = require("passport-local").Strategy
const bcrypt = require("bcrypt")
const usuario = require("../models/Usuario")
const { Op, literal, fn, col, where } = require('sequelize')

module.exports = function(passport) {
    passport.use(new localStrategy({usernameField: "email", passwordField: "senha"}, async (email, senha, done) => {
        // let senhaHash = await bcrypt.hash('master2024', 10)
        // await usuario.create({nome: "master",
        //     sexo: "M",
        //     nascimento: new Date(),
        //     cargo:"",
        //     eAdmin: true,
        //     telefone: "",
        //     whatsapp: "",
        //     nickname:"master",
        //     email:"",
        //     senha:senhaHash,
        //     id_empresa_padrao: '123',
        //     nome_empresa_padrao: "qualquer",
        //     status: "ativo"})

        // usuario.findOne({ where:{ [Op.or]: {email: email, nickname: email} } })
        // console.log(usuario)
        usuario.findOne({ 
            where:{ 
                [Op.or]: [ { email }, where(fn('binary', col('nickname')), email)]
            }
        })//
        .then((usuario)=> {
            if ( !usuario ) {
                return done(null, false, {message: "Esta conta não existe!"})
            }
            // console.log(usuario)
            let isValid = bcrypt.compareSync(senha, usuario.dataValues.senha)
            if ( isValid ) {
                return done(null, usuario)
            }else {
                return done(null, false, {message: "Senha incorreta!"})
            }
        })
        .catch((erro)=>{
            return done(null, false, {message: erro})
        })
    }))
    passport.serializeUser((user, done) => { return done(null, user.dataValues.id) })
    passport.deserializeUser((id, done) => {usuario.findByPk(id).then((user)=> { return done(null, user) })})
}

