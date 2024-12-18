// require('dotenv').config({path:'./env'})
// import dotenv from 'dotenv';
// dotenv.config({
//     path:"./.env"
// })

// *****
//In node v20.06+ there is no need for dotenv package as node provided built-in support for .env files

import connectDB from "./db/index.js";
import { app } from "./app.js";
connectDB().then(() => { 
    app.on("error", (err) => {
        console.log("Error: App is not able to talk to DB", err)
        throw err;
    })
     app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is listeing at port ${process.env.PORT}`)
    })
})
    .catch((err) => {
        console.log("Mongo DB connection failed ", err);

    })









// /*
// const app= express();
// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(err)=>{
//             console.log("Error: App is not able to talk to DB",err)
//             throw err;
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`Backend is listening on port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("ERROR", error)
//         throw err;
//     }

// })()*/
