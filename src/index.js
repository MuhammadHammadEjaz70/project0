import mongoose from "mongoose";
import { DB_NAME } from "./constants";
import express from 'express';

const app= express();
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error",(err)=>{
            console.log("Error: App is not able to talk to DB",err)
            throw err;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`Backend is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR", error)
        throw err;
    }

})()