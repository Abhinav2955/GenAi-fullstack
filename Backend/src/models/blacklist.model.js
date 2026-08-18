const mongoose=require("mongoose")

const blackListTokenSchema=new mongoose.Schema({
    token:{
        type:String,
        required:[true,"Token is required to be added in blacklist"]
    }
},{
        timestamps:true
    }
)
const tokenBlacklistModel=mongoose.model("blacklistToken",blackListTokenSchema)

module.exports=tokenBlacklistModel