const express = require('express')
const router = express.Router()
const path = require('path')
const empresa = require('../models/Empresa')
const { eAdmin } = require(`../helpers/eAdmin`)
const {resolveRoutes} = require(`../helpers/resolveRoutes`)


const barraRoute = resolveRoutes()


router.get('/obter', async (req, res)=> {
    let empresas = await empresa.findAll()
    res.json({empresas})
})

router.get('/cadastrar', eAdmin, (re, res) => {
    res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}empresa${barraRoute}cadastrar`))
})

router.post('/cadastrar', eAdmin, async (req, res) => {
    let { nome } = req.body
    let erros = []
    if ( !nome || typeof nome == undefined || nome == null ) erros.push({text: `Empresa inválida.`})

    let empresaCompare = await empresa.findOne({where: {nome}})
    if ( !empresaCompare ) {
        empresa.create({ nome })
        .then(() => {
            req.flash(`success_msg`, `Empresa cadastrada com sucesso!`)
            res.redirect(`/`)
        })
        .catch((erro) => {
            let erros = [{text: erro.errors[0].message}]
            res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}empresa${barraRoute}cadastrar`), {erros, dados: req.body})
        })
    }else {
        erros.push({text: `empresa já cadastrada.`})
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}empresa${barraRoute}cadastrar`), {erros, dados: req.body})
    }

})

router.get('/listar', async (req, res) => {
    let empresas = await empresa.findAll()
    empresas = JSON.parse(JSON.stringify(empresas, null, 2))
    if ( empresas.length == 0 ) {
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}empresa${barraRoute}listar`))
    }else {
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}empresa${barraRoute}listar`), {empresas})
    }
})


module.exports = router
