const express = require('express');
const colors = require('colors');
const cors = require('cors');
const DB = require('./config/ContingDB');
const authroute = require('./routes/authRoutes');
// const { route } = require('./routes/authRoutes');
const dotenv = require('dotenv').config();




const port = 8000;
const app = express();
app.use(cors())
app.use(cors(
    {
        origin: "*",
    }
))

app.use(express.json())

app.use(express.urlencoded({ extended: true }))
app.use("/auth", authroute)
DB()



app.listen(port, () => {
    console.log(`conting ${port}`);
})