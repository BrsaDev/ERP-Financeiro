module.exports = {
    eAdmin: (req, res, next) => {
        if ( req.user.eAdmin ) return next()
        req.flash("error_msg", "Restrição: ")
        req.flash("error_msg_destaque", "Você precisa de autorização para entrar!")
        res.redirect("/")
    }
}