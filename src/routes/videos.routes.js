import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
    changeVideoStatus,
    deleteVideo,
    listAllVideos,
    uploadVideo,
    listAllUserVideos,
    updateVideoFile,
    updateVideoThumbnail,
    updateVideo,
    listSigleVideo
} from "../controllers/videos.controller.js";


const router = Router();
router.use(verifyJWT)

router.route('/upload-video').post(upload.fields([
    {
        name: "videoFile",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount: 1
    }
]), uploadVideo);
router.route("/change-video-status/:videoId").patch(changeVideoStatus)
router.route("/deleteVideo/:videoId").delete(deleteVideo)
router.route("/update-video-file/:videoId").patch(upload.single("videoFile"),updateVideoFile)
router.route("/update-video-thumbnail/:videoId").patch(upload.single("thumbnail"),updateVideoThumbnail)
router.route("/update-video/:videoId").patch(updateVideo)
router.route("/all-videos").get(listAllVideos)
router.route("/:videoId").get(listSigleVideo)
router.route("/all-user-videos/:userId").get(listAllUserVideos) 


export default router;