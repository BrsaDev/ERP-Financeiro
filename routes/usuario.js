const express = require('express')
const router = express.Router()
const path = require('path')
const Usuario = require('../models/Usuario')
const Cargo = require('../models/Cargo')
const Empresa = require('../models/Empresa')
const bcrypt = require(`bcrypt`)
const { eAdmin } = require(`../helpers/eAdmin`)
const {resolveRoutes} = require(`../helpers/resolveRoutes`)


const barraRoute = resolveRoutes()

router.get(`/listar`, async (req, res) => {
    // await usuario.update({status: `Ativo`}, {where: {id:2}})
    Usuario.findAll()
    .then((usuarios) => {
        usuarios = usuarios.map(item=>{
            item.dataValues.eAdmin = ( item.dataValues.eAdmin == `1` ? `sim` : `não` )
            item.dataValues.nascimento = item.dataValues.nascimento.toLocaleDateString('pt-BR', {timeZone: 'UTC'}).split(' ')[0]
            return item.dataValues
        })
        // console.log(usuarios)
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}usuario${barraRoute}listar`), {
            usuarios
        })
    }).catch(() => {
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}usuario${barraRoute}listar`))
    })
    
})

router.get(`/cadastrar`, eAdmin, async (req, res) => {
    let cargos = await Cargo.findAll()
    let empresas = await Empresa.findAll()
    let users = await Usuario.findAll()
    res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}usuario${barraRoute}cadastrar`), {dados: { cod_usuario: (users.length + 1), cargos, empresas }})
})

router.post(`/cadastrar`, eAdmin, async (req, res) => {
    let { 
        nome, email, senha, confirmar_senha, nickname, cod_empresa_padrao, 
        empresa_padrao, cargo, eAdmin, whatsapp, nascimento, telefone, sexo, status
    } = req.body
    var erros = []

    if ( !nome || typeof nome == undefined || nome == null ) erros.push({text: `Nome inválido.`})
    if ( !email || typeof email == undefined || email == null ) erros.push({text: `Email inválido.`})
    if ( !senha || typeof senha == undefined || senha == null ) erros.push({text: `Senha inválida.`})
    if ( !confirmar_senha || typeof confirmar_senha == undefined || confirmar_senha == null ) erros.push({text: `Repetição da senha inválida.`})
    if ( senha.length < 4 ) erros.push({text: `Senha muito curta, precisa ter 4 ou mais caracteres.`})
    if ( senha != confirmar_senha ) erros.push({text: `As senhas são diferentes.`})
    if ( nickname.length < 3 ) erros.push({text: `Login muito curto, precisa ter 3 ou mais caracteres.`})
    if ( !empresa_padrao || typeof empresa_padrao == undefined || empresa_padrao == null ) erros.push({text: `Nome da Empresa padrão inválido.`})
    

    if ( erros.length > 0 ) {
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}usuario${barraRoute}cadastrar`), {erros, dados: req.body})
    }else {
        let nicknameCompare = await Usuario.findOne({ where: { nickname } })
        if ( nicknameCompare ) {
            erros.push({text: `Este login já existe.`})
            return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}usuario${barraRoute}cadastrar`), {erros, dados: req.body})
        }
        let cargoCompare = await Cargo.findOne({ where: { nome: cargo } })
        if ( !cargoCompare ) {
            erros.push({text: `Este cargo não está cadastrado.`})
            return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}usuario${barraRoute}cadastrar`), {erros, dados: req.body})
        }
        let empresaCompare = await Empresa.findByPk(cod_empresa_padrao)
        if ( !empresaCompare ) {
            erros.push({text: `Esta empresa não está cadastrada.`})
            return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}usuario${barraRoute}cadastrar`), {erros, dados: req.body})
        }
        if ( empresaCompare.dataValues.nome != empresa_padrao ) {
            erros.push({text: `O código da empresa não confere com o nome.`})
            return res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}usuario${barraRoute}cadastrar`), {erros, dados: req.body})
        }
        let emailCompare = await Usuario.findOne({ where: { email } })
        if ( !emailCompare ) {
            let senhaHash = await bcrypt.hash(senha, 10)
            Usuario.create({ 
                nome, 
                email, 
                senha: senhaHash, 
                eAdmin,
                nickname, 
                id_empresa_padrao: cod_empresa_padrao, 
                nome_empresa_padrao: empresa_padrao, 
                cargo, 
                whatsapp, 
                telefone, 
                sexo,
                nascimento,
                status
            }).then((usuario) => {
                req.flash(`success_msg`, `Cadastro realizado com sucesso!`)
                res.redirect(`/`)
            }).catch((erro) => {
                let erros = [{text: erro.errors[0].message}]
                res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}usuario${barraRoute}cadastrar`), {erros, dados: req.body})
            })
        }else {
            erros.push({text: `Email já cadastrado.`})
            res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}usuario${barraRoute}cadastrar`), {erros, dados: req.body})
        }
        
    }
    
})

module.exports = router
