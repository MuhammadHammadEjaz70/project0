import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createComment, deleteComment, listVideoComments, updateComment } from "../controllers/comments.controller.js";

const router=Router();

router.route("/create-comment").post(verifyJWT,createComment)
// todo pagination 
router.route("/list-video-comments/:videoId").get(listVideoComments)
router.route("/update-comment/:commentId").patch(verifyJWT,updateComment)
router.route("/delete-comment/:commentId").delete(verifyJWT,deleteComment)


export default router;