const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use(express.json())
app.use(cookieParser())
// require all the routes here
const authRouter=require("./routes/auth.routes")
const interviewRouter=require("./routes/interview.routes")


// using all the routes here
app.use("/api/auth",authRouter)
app.use("/api/interview",interviewRouter)

module.exports=app