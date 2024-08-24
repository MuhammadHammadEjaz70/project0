// require('dotenv').config({path:'./env'})
// import dotenv from 'dotenv';
// dotenv.config({
//     path:"./env"
// })

// *****
// node v20.06+ there is no need for dotenv package as node provided built-in support for .env files

import connectDB from "./db/index.js";
connectDB();










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
