import mongoose,{Schema} from "mongoose";

const subscriptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        //one who is subscribing
        //mein ny kis kis ko subscribe kiya wa hai
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,
        //one to whom subscriber is subscribing
        //kis kis ny mujhy su bscribe kiya wa hy
        ref:"User"
    },
},{timestamps:true})

export const Subscription=mongoose.model("Subscription",subscriptionSchema)