const jwt = require('jsonwebtoken');
const userScherma = require('../schema/userScherma');
const asyncHandeler = require('express-async-handler')

const verifyToken = asyncHandeler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token not provided" })
    }

    const token = authHeader.split(' ')[1];


    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: "Invalid Token" })

        }
        const user = await userScherma.findOne({ _id: decoded.id })
        // req.userId = decoded.id;
        if (!user) {
            return res.status(401).json({ message: "Invalid Token" })
        }
        req.user = user;
        next();
    })
});

module.exports = {
    verifyToken
}