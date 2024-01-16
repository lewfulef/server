// 1. IMPORTACIONES
const express = require('express')
const app = express()
const cors = require('cors')
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

const auth = require('./middleware/authorization')

const connectDB = require('./config/db')

const Guitarra = require('./models/Guitar')
const Usuario = require('./models/User')



// 2. MIDDLEWARES
// VARIABLES DE ENTORNO
require('dotenv').config()

// CONEXIÓN A DB
connectDB()

// Habilitar CORS
app.use(cors())

app.use(express.json());


// MERCADO PAGO

const mercadopago = require("mercadopago")
const { update } = require('./models/Guitar')

mercadopago.configure({
    access_token: "TEST-6919692908752702-011423-4a00cbf19ef62a36b4f8840c65f6ea24-1639608442"
})


// 3. RUTEO

// A. GUITARRAS

app.get("/la-dona-gatona/obtener-guitarras", async (req, res) => {
    try {
        const guitarras = await Guitarra.find({})

        res.json({
            guitarras
        })

    } catch (error) {
        res.status(500).json({
            msg: "Hubo un error obteniendo los datos"
        })
    }
})

app.get("/la-dona-gatona/obtener-guitarra/:id", async (req, res) => {

    const { id } = req.params

    try {
        
        const guitar = await Guitarra.findById(id)

        res.json({
            guitar
        })

    } catch (error) {
        res.status(500).json({
            msg: "Hubo un error obteniendo los datos"
        })
    }


})

app.post("/la-dona-gatona/crear-guitarra", async (req, res) => {

    const {
        nombre,
        precio,
        imagen,
        color } = req.body

    try {

        const nuevaGuitarra = await Guitarra.create({ nombre, precio, imagen, color })

        res.json(nuevaGuitarra)

    } catch (error) {

        res.status(500).json({
            msg: "Hubo un error creando la guitarra",
            error
        })

    }
})

app.put("/la-dona-gatona/actualizar-guitarra", async (req, res) => {

    const { id, nombre, precio } = req.body

    try {
        const actualizacionGuitarra = await Guitarra.findByIdAndUpdate(id, { nombre, precio }, { new: true })

        res.json(actualizacionGuitarra)

    } catch (error) {

        res.status(500).json({
            msg: "Hubo un error actualizando la guitarra"
        })

    }


})

app.delete("/la-dona-gatona/borrar-guitarra", async (req, res) => {

    const { id } = req.body

    try {

        const guitarraBorrada = await Guitarra.findByIdAndRemove({ _id: id })

        res.json(guitarraBorrada)


    } catch (error) {
        res.status(500).json({
            msg: "Hubo un error borrando la guitarra especificada"
        })
    }

})

// B. USUARIOS
// CREAR UN USUARIO
app.post("/la-dona-gatona/usuario/crear", async (req, res) => {

    // OBTENER USUARIO, EMAIL Y PASSWORD DE LA PETICIÓN
    const { name, email, password } = req.body

    try {
        // GENERAMOS FRAGMENTO ALEATORIO PARA USARSE CON EL PASSWORD
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt)

        // CREAMOS UN USUARIO CON SU PASSWORD ENCRIPTADO
        const respuestaDB = await Usuario.create({
            name,
            email,
            password: hashedPassword
        })

        // USUARIO CREADO. VAMOS A CREAR EL JSON WEB TOKEN

        // 1. EL "PAYLOAD" SERÁ UN OBJETO QUE CONTENDRÁ EL ID DEL USUARIO ENCONTRADO EN BASE DE DATOS.
        // POR NINGÚN MOTIVO AGREGUES INFORMACIÓN CONFIDENCIAL DEL USUARIO (SU PASSWORD) EN EL PAYLOAD.
        const payload = {
            user: {
                id: respuestaDB._id
            }
        }

        // 2. FIRMAR EL JWT
        jwt.sign(
            payload, // DATOS QUE SE ACOMPAÑARÁN EN EL TOKEN
            process.env.SECRET, // LLAVE PARA DESCIFRAR LA FIRMA ELECTRÓNICA DEL TOKEN,
            {
                expiresIn: 360000 // EXPIRACIÓN DEL TOKEN
            },
            (error, token) => { // CALLBACK QUE, EN CASO DE QUE EXISTA UN ERROR, DEVUELVA EL TOKEN

                if (error) throw error

                res.json({
                    token
                })
            }
        )

    } catch (error) {

        return res.status(400).json({
            msg: error
        })

    }
})


// INICIAR SESIÓN
app.post("/la-dona-gatona/usuario/iniciar-sesion", async (req, res) => {

    // OBTENEMOS EL EMAIL Y EL PASSWORD DE LA PETICIÓN
    const { email, password } = req.body

    try {
        // ENCONTRAMOS UN USUARIO
        let foundUser = await Usuario.findOne({ email })

        // SI NO HUBO UN USUARIO ENCONTRADO, DEVOLVEMOS UN ERROR
        if (!foundUser) {
            return res.status(400).json({ msg: "El usuario no existe" })
        }

        // SI TODO OK, HACEMOS LA EVALUACIÓN DE LA CONTRASEÑA ENVIADA CONTRA LA BASE DE DATOS
        const passCorrecto = await bcryptjs.compare(password, foundUser.password)

        // SI EL PASSWORD ES INCORRECTO, REGRESAMOS UN MENSAJE SOBRE ESTO
        if (!passCorrecto) {
            return await res.status(400).json({ msg: "Password incorrecto" })
        }

        // SI TODO CORRECTO, GENERAMOS UN JSON WEB TOKEN
        // 1. DATOS DE ACOMPAÑAMIENTO AL JWT
        const payload = {
            user: {
                id: foundUser.id
            }
        }

        // 2. FIRMA DEL JWT
        jwt.sign(
            payload,
            process.env.SECRET,
            {
                expiresIn: 3600000
            },
            (error, token) => {
                if (error) throw error;

                //SI TODO SUCEDIÓ CORRECTAMENTE, RETORNAR EL TOKEN
                res.json({ token })
            })

    } catch (error) {
        res.json({
            msg: "Hubo un error",
            error
        })
    }

})

// VERIFICAR USUARIO

// COMO OBSERVACIÓN, ESTAMOS EJECUTANDO EL MIDDLEWARE DE AUTH (AUTORIZACIÓN) ANTES DE ACCEDER
// A LA RUTA PRINCIPAL
app.get("/la-dona-gatona/usuario/verificar-usuario", auth, async (req, res) => {

    try {
        // CONFIRMAMOS QUE EL USUARIO EXISTA EN BASE DE DATOS Y RETORNAMOS SUS DATOS, EXCLUYENDO EL PASSWORD
        const user = await Usuario.findById(req.user.id).select('-password')
        res.json({ user })

    } catch (error) {
        // EN CASO DE HERROR DEVOLVEMOS UN MENSAJE CON EL ERROR
        res.status(500).json({
            msg: "Hubo un error",
            error
        })
    }
})

// ACTUALIZAR USUARIO
app.put("/la-dona-gatona/usuario/actualizar", auth, async (req, res) => {

    // CAPTURAMOS USUARIO DEL FORMULARIO
    const newDataForOurUser = req.body

        try {
        // LOCALIZAMOS EL USUARIO
        const updatedUser = await Usuario.findByIdAndUpdate(
            req.user.id,
            newDataForOurUser,
            { new: true }
        ).select("-password")
        
        res.json(updatedUser)
            

        } catch (error) {
            console.log(error)
            res.send(error)
        }
    }
)




// C. CHECKOUT MERCADOPAGO


app.post("/la-dona-gatona/mercadopago", async (req, res) => {

    const preference = req.body
  
    const responseMP = await mercadopago.preferences.create(preference)

    console.log(responseMP)

    res.json({
        checkoutId: responseMP.body.id
    });

})



// 4. SERVIDOR
app.listen(process.env.PORT, () => console.log("El servidor está de pie"))