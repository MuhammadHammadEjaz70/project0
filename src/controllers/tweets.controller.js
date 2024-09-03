import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.models.js"
import { ApiResponse } from "../utils/ApiResponse.js";


export const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content || content == "") {
        throw new ApiError(401, "Tweet content is empty");
    }
    const tweet = await Tweet.create({
        owner: req.user?._id,
        content
    })
    if (!tweet) {
        throw new ApiError(500, "Something went wrong whilte creating new tweet")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Tweet created succesfully")
        )
})

export const listSingleTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const singleTweet = await Tweet.findById(tweetId);
    if (!singleTweet) {
        throw new ApiError(404, singleTweet, "No tweet Found")
    }
    return res.status(200).json(new ApiResponse(200, singleTweet, "Succesfull"))

})
// todo : pagination
export const listAllTweets = asyncHandler(async (req, res) => {
    const allTweets = await Tweet.find();
    if (!allTweets) {
        throw new ApiError(404, allTweets, "No tweets Found")
    }
    return res.status(200).json(new ApiResponse(200, allTweets, "All tweets"))

})
// todo : pagination
export const listAllUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const allTweets = await Tweet.find({ owner: userId });
    if (!allTweets) {
        throw new ApiError(404, allTweets, "No tweets Found")
    }
    return res.status(200).json(new ApiResponse(200, allTweets, "All tweets"))

})

export const editTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) throw new ApiError(404, "No tweet found");

    if (tweet.owner.toString() !== userId.toString()) throw new ApiError(403, "Forbidden")

    if (!content) throw new ApiError(400, "Content is missing");
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: {
            content
        }
    }, { new: true })
    return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet Updated Succesfully"))

})

export const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId=req.user._id;

    const tweet=await Tweet.findById(tweetId);
    if(!tweet) throw new ApiError(404,"Tweet not found");
     
    if(tweet.owner.toString() !== userId.toString()) throw new ApiError(403,"Forbidden");

    await Tweet.findByIdAndDelete(tweetId)
    return res.status(200).json(new ApiResponse(200, {}, "Tweet Deleted Succesfully"))

})