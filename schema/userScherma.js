const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    restPasswordToken: String,
    restPasswordExpire: Date,
    confirmationCode: String,
    isVerified: {
        type: Boolean,
        default: false,
    },
    isfinalVerified: {
        type: Boolean,
        default: false,
    },
})


module.exports = mongoose.model('User', userSchema)