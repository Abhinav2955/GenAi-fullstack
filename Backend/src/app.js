const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use(express.json())
// require all the routes here
const authRouter=require("./routes/auth.routes")


// using all the routes here
app.use("/api/auth",authRouter)

module.exports=app