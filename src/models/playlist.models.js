import mongoose, {Schema} from "mongoose";


const playListSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    videos:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }],
    description:{
        type:String
    }
    
},{timestamps:true})

export const Playlist=mongoose.model('Playlist',playListSchema)