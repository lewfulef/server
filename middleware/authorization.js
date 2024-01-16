const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {

    const token = req.header('x-auth-token')

    if(!token) {
        return res.status(401).json({
            msg: "No hay token, permiso no válido"
        })
    }

    try {
        const openToken = jwt.verify(token, process.env.SECRET)    

        req.user = openToken.user

        next()


    } catch (error) {
        res.json({
            msg: "Hubo un error",
            error
        })
    }

}
