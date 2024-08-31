import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app=express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//import Routes
import userRouter from "./routes/users.routes.js"
import commentRouter from "./routes/comments.routes.js"
import likeRouter from "./routes/likes.routes.js"
import playlistRouter from "./routes/playlists.routes.js"
import subscriptionRouter from "./routes/subscriptions.routes.js"
import tweetRouter from "./routes/tweets.routes.js"
import videoRouter from "./routes/videos.routes.js"

//routes declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/playlists",playlistRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/subcriptions",subscriptionRouter)

export {app};