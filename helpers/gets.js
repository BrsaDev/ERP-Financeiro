const VisibilidadeColunaTabConta = require('../models/VisibilidadeColunaTabConta')

module.exports = {
    getVisibleColumns: async (req, res, next) => {
        try {
            let nickname = req.user.dataValues.nickname
            let visibilidadeColunas = await VisibilidadeColunaTabConta.findOne({where: {usuario: nickname}})
            if ( !visibilidadeColunas ) { 
                req.visibleColumns = false
                return next()
            }
            visibilidadeColunas = JSON.parse(JSON.stringify(visibilidadeColunas, null, 2))
            delete visibilidadeColunas.id
            delete visibilidadeColunas.usuario
            req.visibleColumns = visibilidadeColunas
            next()
        }catch(erro) { 
            req.visibleColumns = false
            next()
        }
    }
}
