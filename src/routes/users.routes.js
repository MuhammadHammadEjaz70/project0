import { Router } from 'express'
import { accessRefreshToken, changeCurrentPassword, getCurrentUser, getUserChannelProfile, getUserWatchHistory, loginUser, logoutUser, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from '../controllers/users.controller.js';
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from '../middlewares/auth.middleware.js';


const router = Router()

router.route("/register").post(
    upload.fields(
        [{
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        }])
    , registerUser)

router.route("/login").post(loginUser)

//secured routes 
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refreshToken").post(accessRefreshToken)
router.route("/currentUser").get(verifyJWT, getCurrentUser)
router.route("/getUserChannelProfile/:username").get(verifyJWT,getUserChannelProfile)
router.route("/getUserWatchHistory").get(verifyJWT,getUserWatchHistory)
router.route("/changeCurrentPassword").post(verifyJWT, changeCurrentPassword)
router.route("/updateUser").patch(verifyJWT, updateAccountDetails)
router.route("/updateUserAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/updateUserCoverImage").patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage)

export default router;