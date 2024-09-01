import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet,editTweet,listAllTweets,deleteTweet, listAllUserTweets, listSingleTweet } from "../controllers/tweets.controller.js";

const router=Router();

router.use(verifyJWT) // apply verifyJWT middleware to all the routes in this file

router.route("/").post(createTweet);
router.route("/listAll").get(listAllTweets);
router.route("/single-tweet/:tweetId").get(listSingleTweet);
router.route("/listAllUserTweets/:userId").get(listAllUserTweets);
router.route("/:tweetId").patch(editTweet).delete(deleteTweet)

export default router;
