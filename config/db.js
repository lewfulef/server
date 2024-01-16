const mongoose = require("mongoose")


const connectDB = async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })

        console.log("Base de datos conectada")

    } catch (error) {
      console.log(error)
      process.exit(1) // DETIENE LA APP POR COMPLETO
    }

}

module.exports = connectDB