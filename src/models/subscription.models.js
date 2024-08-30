import mongoose,{Schema} from "mongoose";

const subscriptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId,//one who is subscribing
        //mein kis kis ko subscribe kiya wa hai
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,//one to whom subscriber is subscribing
        //kis kis ny mujhy subscribe kiya wa hy
        ref:"User"
    },
},{timestamps:true})

export const Subscription=mongoose.model("Subscription",subscriptionSchema)