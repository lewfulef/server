const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({

    name:{
        type: String,
        required: true
    },
    lastname: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    zipcode: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
}, {
    timestamps: true
})


const User = mongoose.model("User", UserSchema)

module.exports = User


