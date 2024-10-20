import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const commentSchema=new Schema({

    content:{
        type:String,
        required:true
    },
    video:{
        required:true,
        type:Schema.Types.ObjectId,
        ref:"Video"
    },
    owner:{
        required:true,
        type:Schema.Types.ObjectId,
        ref:"User"
    }

},{timestamps:true})
commentSchema.index({ video: 1 });
commentSchema.plugin(mongooseAggregatePaginate)
export const Comment=mongoose.model("Comment",commentSchema)