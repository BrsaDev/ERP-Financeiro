const express = require('express')
const router = express.Router()
const path = require('path')
const descricao = require('../models/Descricao')
const { eAdmin } = require("../helpers/eAdmin")


router.get('/obter', async (req, res)=> {
    let descricoes = await descricao.findAll()
    res.json({descricoes})
})

router.get('/cadastrar', eAdmin, (re, res) => {
    res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\descricao\\cadastrar"))
})

router.post('/cadastrar', eAdmin, async (req, res) => {
    let { nome } = req.body
    let erros = []
    if ( !nome || typeof nome == undefined || nome == null ) erros.push({text: "Descrição inválido."})

    let descricaoCompare = await descricao.findOne({where: {nome}})
    if ( !descricaoCompare ) {
        descricao.create({ nome })
        .then(() => {
            req.flash("success_msg", "Descrição cadastrado com sucesso!")
            res.redirect("/")
        })
        .catch((erro) => {
            let erros = [{text: erro.errors[0].message}]
            res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\descricao\\cadastrar"), {erros, dados: req.body})
        })
    }else {
        erros.push({text: "Descrição já cadastrada."})
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\descricao\\cadastrar"), {erros, dados: req.body})
    }

})

router.get('/listar', async (req, res) => {
    let descricoes = await descricao.findAll()
    descricoes = JSON.parse(JSON.stringify(descricoes, null, 2))
    if ( descricoes.length == 0 ) {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\descricao\\listar"))
    }else {
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\descricao\\listar"), {descricoes})
    }
})


module.exports = router
