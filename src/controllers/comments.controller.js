import { Comment } from "../models/comments.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createComment = asyncHandler(async (req, res) => {
    const { content, video } = req.body

    if (!content || !video) throw new ApiError(400, "Please provide compltet data of video and comment")
    const newComment = await Comment.create({
        content,
        video,
        owner: req.user?._id
    })
    if (!newComment) throw new ApiError(500, "Internal server error")
    return res.status(200).json(new ApiResponse(200, newComment, "Comment created successfully"))

})
export const listVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const allComments = await Comment.find({ video: videoId })
        .populate('video owner')
        .exec();

    //todo:aggreate functions

    if (!allComments) throw new ApiError(500, "No Comments Founds");
    return res.status(200).json(new ApiResponse(200, allComments, "Successful"))

})
export const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId=req.user?._id;
    const {commentId}=req.params;

    const comment=await Comment.findById(commentId)
    if(!comment) throw new ApiError(404,"No Comment found")

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Forbidden");
    }

    if (!content) throw new ApiError(400, "Content is required");

    const updatedComment=await Comment.findByIdAndUpdate(commentId,{
        $set:{
            content
        }
    },{new:true})

    if(!updatedComment) throw new ApiError(500,"Internal Server Error");

    return res.status(200).json(new ApiResponse(200,updatedComment,"Comment updated succesfully"))
})
export const deleteComment = asyncHandler(async (req, res) => { 
    const userId=req.user?._id;
    const {commentId}=req.params;

    const comment=await Comment.findById(commentId)
    if(!comment) throw new ApiError(404,"No Comment found")

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Forbidden");
    }
    await Comment.findByIdAndDelete(commentId);
    res.status(200).json(new ApiResponse(200,"Comment Deleted succesfully"))
})