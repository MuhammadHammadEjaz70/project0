import { Video } from "../models/videos.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, deleteVideoFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose";
const { ObjectId } = mongoose.Types;

// export const listAllVideos = asyncHandler(async (req, res) => {
// const { page = 1, limit = 10, query, sortBy, sortType } = req.query;
//     // console.log(req.user)
//     const {_id}=req.user
//     // console.log(req.cookies);
//     const pipeline = [];

//     // for using Full Text based search u need to create a search index in mongoDB atlas
//     // you can include field mapppings in search index eg.title, description, as well
//     // Field mappings specify which fields within your documents should be indexed for text search.
//     // this helps in seraching only in title, desc providing faster search results
//     // here the name of search index is 'search-videos'
//     if (query) {
//         pipeline.push({
//             $search: {
//                 index: "search-videos",
//                 text: {
//                     query: query,
//                     path: ["title", "description"] //search only on title, desc
//                 }
//             }
//         });
//     }

//     if (_id) {
//         if (!isValidObjectId(_id)) {
//             throw new ApiError(400, "Invalid userId");
//         }

//         pipeline.push({
//             $match: {
//                 owner: new mongoose.Types.ObjectId(_id)
//             }
//         });
//     }

//     // fetch videos only that are set isPublished as true
//     pipeline.push({ $match: { isPublished: true } });

//     //sortBy can be views, createdAt, duration
//     //sortType can be ascending(-1) or descending(1)
//     if (sortBy && sortType) {
//         pipeline.push({
//             $sort: {
//                 [sortBy]: sortType === "asc" ? 1 : -1
//             }
//         });
//     } else {
//         pipeline.push({ $sort: { createdAt: -1 } });
//     }

//     pipeline.push(
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "owner",
//                 foreignField: "_id",
//                 as: "ownerDetails",
//                 pipeline: [
//                     {
//                         $project: {
//                             username: 1,
//                             "avatar.url": 1
//                         }
//                     }
//                 ]
//             }
//         },
//         {
//             $unwind: "$ownerDetails"
//         }
//     )

//     const videoAggregate = Video.aggregate(pipeline);

//     const options = {
//         page: parseInt(page, 10),
//         limit: parseInt(limit, 10)
//     };

//     const video = await Video.aggregatePaginate(videoAggregate, options);

//     return res
//         .status(200)
//         .json(new ApiResponse(200, video, "Videos fetched successfully"));
// });


export const listAllVideos = asyncHandler(async (req, res) => {
    const { query, sortBy, sortOrder } = req.query;
    const { _id } = req.user;
    const pipeline = [];
    let { page, limit } = req.query
    // query stage
    // if (query) {
    //     pipeline.push({
    //         $match: {
    //             $or: [
    //                 { title: { $regex: query, $options: 'i'}},
    //                 {description: {$regex: query, $options: "i"
    //                     }
    //                 }
    //             ],
    //         }
    //     })
    // }

    //     // for using Full Text based search u need to create a search index in mongoDB atlas
    //     // you can include field mapppings in search index eg.title, description, as well
    //     // Field mappings specify which fields within your documents should be indexed for text search.
    //     // this helps in seraching only in title, desc providing faster search results
    //     // here the name of search index is 'search-videos'  

    if (query) {
        pipeline.push({
            $search:
            {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }

        });
    }
    if (_id) {
        if (!isValidObjectId(_id)) {
            throw new ApiError(400, "Invalid userId");
        }
    }

    // is Publsihed stage
    pipeline.push({ $match: { isPublished: true } })

    //look up stages
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "videoOwner",
        }
    }, {
        $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "videoLikes",
        },
    }, {
        $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "video",
            as: "videoComments",
            pipeline: [
                {
                    $project: {
                        _id: 0,
                        owner: 1,
                        content: 1,
                    },
                }
            ]
        },
    },
        {
            $addFields: {
                commentsCount: {
                    $size: "$videoComments"
                },
                likesCount: {
                    $size: "$videoLikes"
                },
                videoOwner: {
                    $let: {
                        vars: { firstOwner: { $first: "$videoOwner" } },
                        in: {
                            username: "$$firstOwner.username",
                            email: "$$firstOwner.email"
                        }
                    }
                }
            }
        })


    //sortBy can be views, createdAt, duration
    //sortType can be ascending(-1) or descending(1)
    if (sortBy && sortOrder) {
        pipeline.push({
            $sort: {
                [sortBy]: sortOrder === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    const videos = await Video.aggregate(pipeline)
    page = parseInt(page, 10)
    limit = parseInt(limit, 10)
    const paginateData = {};
    paginateData.totalDocs = videos.length;
    paginateData.limit = limit;
    paginateData.page = page;
    paginateData.totalPages = paginateData.totalDocs / limit;
    paginateData.pagingCounter = page === 1 ? 1 : limit + 1
    paginateData.nextPage = paginateData.totalDocs > limit * page ? page + 1 : null;
    paginateData.prevPage = page === 1 ? null : page - 1;
    paginateData.hasNextPage = paginateData.nextPage ? true : false
    paginateData.hasPrevPage = paginateData.prevPage ? true : false
    console.log(paginateData)
    
   
    


    // aggreagate paginate is getting along with search field so we will do our own pagination.

    if (!videos) throw new ApiError(400, {}, "No Vidoes found")

    return res.status(200).json(new ApiResponse(200, videos, "Successful"))

})

export const listSigleVideo = asyncHandler(async (req, res) => {

    const pipeline = [];
    // //matching Stage
    pipeline.push({
        $match: {
            $and: [
                { _id: ObjectId.createFromHexString(req.params.videoId) },
                { isPublished: true }
            ]
        }
    }
    )


    //look up stages
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "videoOwner",
        }
    }, {
        $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "video",
            as: "videoLikes",
        },
    }, {
        $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "video",
            as: "videoComments",
            pipeline: [
                {
                    $project: {
                        _id: 0,
                        owner: 1,
                        content: 1,
                        createdAt: 1,
                    },

                }
            ]
        },
    },
        {
            $addFields: {
                commentsCount: {
                    $size: "$videoComments"
                },
                likesCount: {
                    $size: "$videoLikes"
                },
                videoOwner: {
                    $let: {
                        vars: { firstOwner: { $first: "$videoOwner" } },
                        in: {
                            username: "$$firstOwner.username",
                            email: "$$firstOwner.email"
                        }
                    }
                }
            }
        })

    pipeline.push(
        {
            $project: {
                owner: 0,
            }
        }
    )


    const video = await Video.aggregate(pipeline)

    if (!video) throw new ApiError(400, {}, "No Vidoe found")
    return res.status(200).json(new ApiResponse(200, video, "Successful"))

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
    if (!title) {
        throw new ApiError(404, "title is required")
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

