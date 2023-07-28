const asyncHandeler = require('express-async-handler')
const bcrypt = require('bcryptjs')
const userScherma = require('../schema/userScherma')
const { generateToken } = require('../utils/JsonToken')
const nodemailer = require('nodemailer')




const loginUser = asyncHandeler(async (req, res) => {
    const { email, password } = req.body

    try {
        const user = await userScherma.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "User Not Found" })

        }
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid eamil or password" })
        }

        const token = generateToken(user)

        res.status(200).json({
            user: {
                email: user.email,
                _id: user._id,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                __v: user.__v
            },
            token
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
})

const resetPasswordToken = asyncHandeler(async (req, res) => {
    const { email } = req.body

    const user = await userScherma.findOne({ email })

    if (!user) {
        res.status(400).json({ message: "User Not Found" })
    }
    const token = Math.random().toString(36).slice(-8)

    user.restPasswordToken = token
    user.restPasswordExpire = Date.now() + 3600000

    await user.save()

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        // host: "sandbox.smtp.mailtrap.io",
        // port: 2525,
        auth: {
            user: process.env.GMAIL_NODEMAILER,
            pass: process.env.NODEMAILER_PASSWORD,

        }
    })
    const message = {
        from: process.env.GMAIL_NODEMAILER,
        to: user.email,
        subject: "Password Reset",
        html: `<h3>You are recieving this email </h3> has requested the reset of a password. \n\n  Reset Password Click this List <h1><b>${token}</b></h1>`
    }

    transporter.sendMail(message, (err, info) => {
        if (err) {
            return res.status(400).json({ message: "Error sending the email. Please try again later." })
        }
        res.status(200).json({ meassage: `Email Sent: ${info.response}` })
    })
})


const resetPassword = asyncHandeler(async (req, res) => {
    const { token } = req.params
    const { password } = req.body

    const user = await userScherma.findOne({ restPasswordToken: token, restPasswordExpire: { $gt: Date.now() } })

    if (!user) {
        return res.status(404).json({ message: "Invaid Token or Token Expired" })
    }
    const salt = await bcrypt.genSalt(10)
    // const hashpassword = await bcrypt.hash(password, salt)
    const hashpassword = await bcrypt.hash(password, salt)
    user.password = hashpassword;
    user.restPasswordToken = undefined;
    user.restPasswordExpire = undefined;


    await user.save()
    res.status(200).json({ message: "Password Reset Successfully" })
})




// !   verfy register

function generateRandomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const codeLength = 6;
    let code = '';
    for (let i = 0; i < codeLength; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

// Send the verification code via email
async function sendVerificationEmail(email, code) {
    try {
        // Replace these with your email sender credentials
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_NODEMAILER,
                pass: process.env.NODEMAILER_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.GMAIL_NODEMAILER,
            to: email,
            subject: 'Verification Code',
            text: `Your verification code is: ${code}`,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error while sending verification email:', error);
        throw error;
    }
}


const registeremail = asyncHandeler(async (req, res) => {


    try {
        const { email } = req.body;

        // Check if the email is already registered
        const existingUser = await userScherma.findOne({ email });

        if (existingUser) {
            // If the user is already verified, return an error
            if (existingUser.isfinalVerified) {
                return res.status(409).json({ message: 'Email already registered' });
            }

            // If the user is not verified, resend the verification code
            existingUser.confirmationCode = generateRandomCode();
            await existingUser.save();

            // Send the new verification code via email
            await sendVerificationEmail(email, existingUser.confirmationCode);

            // Respond with a success message
            return res.status(200).json({ message: 'Verification code sent successfully' });
        }

        // If the email is not registered, proceed with new registration

        // Generate a verification code
        const verificationCode = generateRandomCode();

        // Save the user's email and verification code to the database
        const newUser = new userScherma({
            email,
            confirmationCode: verificationCode,
        });
        await newUser.save();

        // Send the verification code via email
        await sendVerificationEmail(email, verificationCode);

        // Respond with a success message
        return res.status(200).json({ message: 'Verification code sent successfully' });
    } catch (error) {
        console.error('Error during user registration:', error);
        return res.status(500).json({ message: 'An error occurred during registration' });
    }
});





const verifycode = asyncHandeler(async (req, res) => {


    // !
    try {
        const { email, confirmationCode } = req.body;

        // Find the user by their email
        const user = await userScherma.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the provided verification code matches the one saved in the database
        if (user.confirmationCode !== confirmationCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Set the user as verified and remove the verification code after verification


        user.isVerified = true;
        await user.save();

        // Respond with a success message
        return res.status(200).json({ message: 'Account verified successfully' });
    } catch (error) {
        console.error('Error during account verification:', error);
        return res.status(500).json({ message: 'An error occurred during account verification' });
    }
});


const registersetpassword = asyncHandeler(async (req, res) => {


    try {
        const { email, password } = req.body;

        // Find the user by their email
        const user = await userScherma.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.confirmationCode) {
            return res.status(401).json({ message: 'Code inValid or worung' });

        }
        // Check if the user is verified
        if (!user.isVerified) {
            return res.status(401).json({ message: 'Account not verified' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        // Set the password and save the user to the database
        user.confirmationCode = undefined;
        user.password = hashPassword;
        user.isfinalVerified = true;
        await user.save();

        // Respond with a success message
        return res.status(200).json({ message: 'Password set successfully' });
    } catch (error) {
        console.error('Error during setting password:', error);
        return res.status(500).json({ message: 'An error occurred during setting password' });
    }
});


module.exports = {
    loginUser,
    resetPasswordToken,
    resetPassword,
    registeremail,
    verifycode,
    registersetpassword,

}