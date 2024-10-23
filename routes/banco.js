const express = require('express')
const router = express.Router()
const path = require('path')
const banco = require('../models/Banco')
const { eAdmin } = require("../helpers/eAdmin")


router.get('/obter', async (req, res)=> {
    let bancos = await banco.findAll()
    res.json({bancos})
})

router.get('/cadastrar', eAdmin, (re, res) => {
    res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\banco\\cadastrar"))
})

router.post('/cadastrar', eAdmin, async (req, res) => {
    let { nome, agencia, conta_corrente } = req.body
    let erros = []
    if ( !nome || typeof nome == undefined || nome == null ) erros.push({text: "Banco inválido."})
    if ( !agencia || typeof agencia == undefined || agencia == null ) erros.push({text: "Banco inválido."})
    if ( !conta_corrente || typeof conta_corrente == undefined || conta_corrente == null ) erros.push({text: "Banco inválido."})

    let bancoCompare = await banco.findOne({where: {conta_corrente}})
    if ( !bancoCompare ) {
        banco.create({ nome: nome, agencia, conta_corrente })
        .then(() => {
            req.flash("success_msg", "Banco cadastrado com sucesso!")
            res.redirect("/")
        })
        .catch((erro) => {
            let erros = [{text: erro.errors[0].message}]
            res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\banco\\cadastrar"), {erros, dados: req.body})
        })
    }else {
        erros.push({text: "Banco com essa conta já cadastrado."})
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\banco\\cadastrar"), {erros, dados: req.body})
    }

})

router.get('/listar', async (req, res) => {
    let bancos = await banco.findAll()
    bancos = JSON.parse(JSON.stringify(bancos, null, 2))
    if ( bancos.length == 0 ) {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\banco\\listar"))
    }else {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\banco\\listar"), {bancos})
    }
})


module.exports = router
