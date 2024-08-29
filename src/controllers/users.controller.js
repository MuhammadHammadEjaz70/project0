import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/users.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

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

const registerUser = asyncHandler(async (req, res) => {
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

const loginUser = asyncHandler(async (req, res) => {
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

const logoutUser = asyncHandler(async (req, res) => {
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

const accessRefreshToken = asyncHandler(async (req, res) => {
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

export { registerUser, loginUser, logoutUser, accessRefreshToken }