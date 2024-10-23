const express = require('express')
const router = express.Router()
const path = require('path')
const usuario = require('../models/Usuario')
const bcrypt = require("bcrypt")
const passport = require("passport")


router.get('/recuperar-senha', (req, res) => {
    res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\admin\\recuperarSenha"))
})

router.post('/recuperar-senha', async (req, res) => {
    let { email } = req.body
    let erros = []
    if ( !email || typeof email == undefined || email == null ) erros.push({text: "Email inválido."})
    if ( erros.length > 0 ) {
        return res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\admin\\recuperarSenha"), {erros, dados: req.body})
    }

    let user = await usuario.findOne({ where: { email } })
    if ( user ) {
        // enviar o email aqui...
        req.flash("success_msg", "Senha enviada para o email: " + email)
        res.redirect("/admin/login")
    }else {
        erros.push({text: "Email não está cadastrado."})
        res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\admin\\recuperarSenha"), {erros, dados: req.body})
    }
})

router.get('/login', (req, res) => {
    res.render(path.join(__dirname.toString().replace("\\routes", ""), "\\views\\admin\\login"))
})

router.post('/login', passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/admin/login",
    failureFlash: true
}))

router.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { 
            req.flash("error_msg", "Houve um erro ao sair.")
            return res.redirect("/")
        }
        res.redirect('/');
    })
})


module.exports = router
