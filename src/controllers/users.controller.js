import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/users.models.js'
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "Something went worng while generating access and resfresh token, Please try again")
  }
}

export const registerUser = asyncHandler(async (req, res) => {
  //step 1: req body mein sy user details niklo
  //step 2: validate user info - not empty
  //step 3 check if user already exisit : email username 
  //step 4: check for images and avatar
  //step 5: upload them to cloudinary :avatar double check
  //step6: creation of user object -- create entry in DB
  //step 7: remove password and refresh token from response 
  //setp 8: check for user creation
  //step 9: return res on succesfull creation other wise send error

  const { email, username, fullName, password } = req.body;

  if ([fullName, username, email, password].some((field) => field?.trim() === "")) {
    ApiError(400, "All fields are required")
  }
  const exisitedUser = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (exisitedUser) {
    throw new ApiError(409, "User already exist");
  }
  const avatarlocalPath = req.files?.avatar[0]?.path
  // const coverImagelocalPath= req?.files?.coverImage[0]?.path

  let coverImagelocalPath;
  if (req.files && Array.isArray(req.files.coverImage && req.files.coverImage.length > 0)) {
    coverImagelocalPath = req?.files.coverImage[0].path

  }

  if (!avatarlocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }
  const avatar = await uploadOnCloudinary(avatarlocalPath)
  const coverImage = await uploadOnCloudinary(coverImagelocalPath)


  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage ? coverImage.url : "",
    username: username.toLowerCase(),
    email,
    password
  })
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user")
  }
  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered Sucessfully",)
  )

})

export const loginUser = asyncHandler(async (req, res) => {
  // get user data from req body
  // validate user data -> check if user exisit or not
  // validate email and password
  // generate access token and refresh token
  // send cookies
  // return response to user with access token and refres token

  const { password, username, email } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  });


  if (!user) {
    throw new ApiError(404, "User doesn't exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password)


  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials")
  }


  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

  const options = {
    httpOnly: true,
    secure: true
  }
  res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {
    user: loggedInUser,
    accessToken,
    refreshToken
  },
    "User logged in succesfully"
  ))

})

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    {
      new: true

    }
  )
  const options = {
    httpOnly: true,
    secure: true

  }
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))

})

export const accessRefreshToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
  if (!incommingRefreshToken) {
    throw new ApiError(401, "Unauthorized request")
  }
  try {
    const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECERT)

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    }
    if (incommingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired")
    }

    const options = {
      httpOnly: true,
      secure: true
    }
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);
    return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, "Token updated Successfully")
      )
  } catch (error) {
    throw new ApiError(500, error?.message || "Invalid refresh token")

  }
})

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if ([oldPassword, newPassword].some((field) => field === "")) {
    throw new ApiError(401, "All fiels are required")
  }
  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password")
  }
  user.password = newPassword
  await user.save({ validateBeforeSave: false })
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password updated sucessfully"))
})

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user))
})

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required")
  }
  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      fullName,
      email
    }
  }, { new: true }).select("-password -refreshToken");
  return res.status(200).json(new ApiResponse(200, user, "User information updated succesfullt"))
})

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarlocalPath = req.file?.path;
  const user= await User.findById(req.user?._id);
  const oldAvatar=user.avatar;
  console.log({oldAvatar})

  if (!avatarlocalPath) {
    throw new ApiError(400, "Avatar file is missing")
  }
  const avatar = await uploadOnCloudinary(avatarlocalPath)
  if(!avatar.url){
    throw new ApiError(400,"Error while updating on avatar")
  }
  const updatedUserAvatar = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      avatar: avatar.url
    },
  }, {
    new: true
  }).select("-password -refreshToken")

  //delete old avatar image from cloudinary
  await deleteFromCloudinary(oldAvatar);

  return res.status(200).json(new ApiResponse(200, updatedUserAvatar, "Avatar updated succesfully"))
})

export const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImagelocalPath = req.file?.path;
  const user=await User.findById(req.user?._id);
  const oldCoverImagePath=user.coverImage;

  if (!coverImagelocalPath) {
    throw new ApiError(400, "Cover image file is missing")
  }
  const coverImage = await uploadOnCloudinary(coverImagelocalPath)
  if(!coverImage.url){
    throw new ApiError(400,"Error while updating on cover image")
  }
  const updatedUserCoverImage = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      coverImage: coverImage.url
    },
  }, {
    new: true
  }).select("-password -refreshToken")
  
  //delete old cover image from cloudinary
  if(oldCoverImagePath)
     await deleteFromCloudinary(oldCoverImagePath);

  return res.status(200).json(new ApiResponse(200, updatedUserCoverImage, "Cover image updated succesfully"))
})

export const getUserChannelProfile=asyncHandler(async(req,res)=>{
  const {username}=req.params;
  if(!username?.trim()){
    throw new ApiError(400,"usernam is missing")
  }
const channel= await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelsSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false,
          }
        }
      }
      
    },
    {
      $project:{
        fullName:1,
        username:1,
        email:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        avatar:1,
        coverImage:1,
        isSubscribed:1
      }
    }
  ])
  console.log({channel})
  if(!channel?.length){
    throw new ApiError(400,"Channel doesn't exists")
  }
  return res.status(200).json(new ApiResponse(200,channel[0],"User channel data fetched successfully"))
  
})

export const getUserWatchHistory=asyncHandler(async(req,res)=>{
  const user=await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1,
                  }
                }
              ]
            }
          },{
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])
  if(!user){
     throw new ApiError(400,"user doesn't exists");
  }
  console.log({user})
  return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"User watch history fetched"))
})

