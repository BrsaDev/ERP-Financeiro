const express = require('express')
const router = express.Router()
const path = require('path')
const sistema = require('../models/Sistema')
const { eAdmin } = require(`../helpers/eAdmin`)
const {resolveRoutes} = require(`../helpers/resolveRoutes`)


const barraRoute = resolveRoutes()


router.get('/obter', async (req, res)=> {
    let sistemas = await sistema.findAll()
    res.json({sistemas})
})

router.get('/cadastrar', eAdmin, (re, res) => {
    res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}sistema${barraRoute}cadastrar`))
})

router.post('/cadastrar', eAdmin, async (req, res) => {
    let { nome } = req.body
    let erros = []
    if ( !nome || typeof nome == undefined || nome == null ) erros.push({text: `Sistema inválido.`})

    let sistemaCompare = await sistema.findOne({where: {nome}})
    if ( !sistemaCompare ) {
        sistema.create({ nome })
        .then(() => {
            req.flash(`success_msg`, `Sistema cadastrado com sucesso!`)
            res.redirect(`/`)
        })
        .catch((erro) => {
            let erros = [{text: erro.errors[0].message}]
            res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}sistema${barraRoute}cadastrar`), {erros, dados: req.body})
        })
    }else {
        erros.push({text: `Sistema já cadastrada.`})
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}sistema${barraRoute}cadastrar`), {erros, dados: req.body})
    }

})

router.get('/listar', async (req, res) => {
    let sistemas = await sistema.findAll()
    sistemas = JSON.parse(JSON.stringify(sistemas, null, 2))
    if ( sistemas.length == 0 ) {
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}sistema${barraRoute}listar`))
    }else {
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}sistema${barraRoute}listar`), {sistemas})
    }
})


module.exports = router
