const express = require('express')
const router = express.Router()
const path = require('path')
const departamento = require('../models/Departamento')
const { eAdmin } = require("../helpers/eAdmin")


router.get('/obter', async (req, res)=> {
    let departamentos = await departamento.findAll()
    res.json({departamentos})
})

router.get('/cadastrar', eAdmin, (re, res) => {
    res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\departamento\\cadastrar"))
})

router.post('/cadastrar', eAdmin, async (req, res) => {
    let { nome } = req.body
    let erros = []
    if ( !nome || typeof nome == undefined || nome == null ) erros.push({text: "Departamento inválido."})

    let departamentoCompare = await departamento.findOne({where: {nome}})
    if ( !departamentoCompare ) {
        departamento.create({ nome })
        .then(() => {
            req.flash("success_msg", "Departamento cadastrado com sucesso!")
            res.redirect("/")
        })
        .catch((erro) => {
            let erros = [{text: erro.errors[0].message}]
            res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\departamento\\cadastrar"), {erros, dados: req.body})
        })
    }else {
        erros.push({text: "Departamento já cadastrada."})
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\departamento\\cadastrar"), {erros, dados: req.body})
    }

})

router.get('/listar', async (req, res) => {
    let departamentos = await departamento.findAll()
    departamentos = JSON.parse(JSON.stringify(departamentos, null, 2))
    if ( departamentos.length == 0 ) {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\departamento\\listar"))
    }else {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\departamento\\listar"), {departamentos})
    }
})


module.exports = router
