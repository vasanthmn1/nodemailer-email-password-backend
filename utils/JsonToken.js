const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, { "expiresIn": "2m" })
}
module.exports = {
    generateToken
}