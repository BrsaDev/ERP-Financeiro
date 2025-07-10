const express = require('express')
const router = express.Router()
const path = require('path')
const cargo = require('../models/Cargo')
const { eAdmin } = require(`../helpers/eAdmin`)
const {resolveRoutes} = require(`../helpers/resolveRoutes`)


const barraRoute = resolveRoutes()


router.get('/obter', async (req, res)=> {
    let cargos = await cargo.findAll()
    res.json({cargos})
})

router.get('/cadastrar', eAdmin, (re, res) => {
    res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}cargo${barraRoute}cadastrar`))
})

router.post('/cadastrar', eAdmin, async (req, res) => {
    let { nome } = req.body
    let erros = []
    if ( !nome || typeof nome == undefined || nome == null ) erros.push({text: `Cargo inválido.`})

    let cargoCompare = await cargo.findOne({where: {nome}})
    if ( !cargoCompare ) {
        cargo.create({ nome })
        .then(() => {
            req.flash(`success_msg`, `Cargo cadastrado com sucesso!`)
            res.redirect(`/`)
        })
        .catch((erro) => {
            let erros = [{text: erro.errors[0].message}]
            res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}cargo${barraRoute}cadastrar`), {erros, dados: req.body})
        })
    }else {
        erros.push({text: `cargo já cadastrada.`})
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}cargo${barraRoute}cadastrar`), {erros, dados: req.body})
    }

})

router.get('/listar', async (req, res) => {
    let cargos = await cargo.findAll()
    cargos = JSON.parse(JSON.stringify(cargos, null, 2))
    if ( cargos.length == 0 ) {
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}cargo${barraRoute}listar`))
    }else {
        res.render(path.join(__dirname.toString().replace(`${barraRoute}routes`, ``), `${barraRoute}views${barraRoute}cargo${barraRoute}listar`), {cargos})
    }
})


module.exports = router
