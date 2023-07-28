const express = require('express');
const { loginUser, resetPassword, resetPasswordToken, registeremail, verifycode, registersetpassword } = require('../controller/userCtrl');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

router.post('/register', registeremail)
router.post('/registerverifycode', verifycode);
router.post('/registerconform', registersetpassword);

router.post('/login', loginUser)

router.get('/get', verifyToken, (req, res) => {

    res.json({ message: `${req.user.email}` })
})
router.post('/resetPasswordToken', resetPasswordToken)
router.post('/resetPassword/:token', resetPassword)



module.exports = router; 