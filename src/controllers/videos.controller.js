import { Video } from "../models/videos.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, deleteVideoFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";

// todo searching and pagination
export const listAllVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find()
    if (!videos) throw new ApiError(400, {}, "No Vidoes found")

    return res.status(200).json(new ApiResponse(200, videos, "Successful"))

})

export const listAllUserVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const videos = await Video.find({ owner: userId })
    if (!videos) throw new ApiError(400, {}, "No Vidoes found")

    return res.status(200).json(new ApiResponse(200, videos, "Successful"))

})

export const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished } = req.body

    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Some fields are missing")
    }

    const videoFilePath = req.files?.videoFile[0].path;
    const thumbnailPath = req.files?.thumbnail[0].path;

    if (!videoFilePath) throw new ApiError(500, "Video uploading failed")
    if (!thumbnailPath) throw new ApiError(500, "Thumbnail uploading failed")

    const video = await uploadOnCloudinary(videoFilePath);
    const thumbnail = await uploadOnCloudinary(thumbnailPath);

    if (!video) throw new ApiError(500, "Video uploading failed")
    if (!thumbnail) throw new ApiError(500, "Thumbnail uploading failed")

    const finalVideo = await Video.create({
        title,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        description,
        owner: req.user?._id,
        duration: video.video.dar,
        isPublished
    })
    if (!finalVideo) {
        throw new ApiError(500, "Something went wrong video uploading failed");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, finalVideo, "Video uploaded suscessfully")
        )

})

export const changeVideoStatus = asyncHandler(async (req, res) => {
    const { isPublished } = req.body;
    const { videoId } = req.params;
    if (!isPublished) throw new ApiError(400, "Publish status is missing")

    const video = await Video.findByIdAndUpdate(videoId, {
        $set: {
            isPublished
        }
    }, { new: true })

    if (!video) throw new ApiError(500, "Video status is not changed due to some error")

    return res.status(200).json(new ApiResponse(200, video, "Video status updated"))
})

export const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "No Video found")

    await deleteVideoFromCloudinary(video?.videoFile);
    await deleteFromCloudinary(video?.thumbnail);
    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(new ApiError(200, {}, "Video deleted succesfully"))

})

export const updateVideoFile = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "No Video found")

    await deleteVideoFromCloudinary(video?.videoFile);
    const newVideoPath = req.file.path;
    const newVideoCloudinaryPath = await uploadOnCloudinary(newVideoPath);
    const newVideoFile = await Video.findByIdAndUpdate(videoId, {
        $set: {
            videoFile: newVideoCloudinaryPath.url
        }
    }, { new: true })
    return res.status(200).json(new ApiResponse(200, newVideoFile, "Video file updated succesfully"))

})

export const updateVideoThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "No Video found")

    await deleteFromCloudinary(video?.thumbnail);
    const newVideoThumbnailPath = req.file.path;
    const newVideoCloudinaryThumnailPath = await uploadOnCloudinary(newVideoThumbnailPath);

    const newVideoThumbnail = await Video.findByIdAndUpdate(videoId, {
        $set: {
            thumbnail: newVideoCloudinaryThumnailPath.url
        }
    }, { new: true })
    return res.status(200).json(new ApiResponse(200, newVideoThumbnail, "Video thumbnail updated succesfully"))

})

export const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    if(!title){
        throw new ApiError(404,"title is required")
    }
    const video = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title,
            description,
            views: 0,
        }
    }, { new: true });

    if (!video) throw new ApiError(404, "No Video found")


    return res.status(200).json(new ApiResponse(200, video, "Video Updated succesfully"))

})

export const getVideoById=asyncHandler(async(req,res)=>{
    const { videoId } = req.params
    const video= await Video.findById(videoId);

    if(!video) throw new ApiError(404,"No Video found");

    return res.status(200).json(new ApiResponse(200,video,"Successful"))
})