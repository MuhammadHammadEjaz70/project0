import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from "../utils/ApiError.js"
import { User } from '../models/users.models.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

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
    coverImage: coverImage?coverImage.url : "",
    username: username.toLowerCase(),
    email,
    password
  })
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user")
  }
  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered Sucessfully",)
  )

})


export { registerUser }