const asyncHandler = (requestHandler) => {
    (req, res, next) => Promise.resolve(requestHandler(req, res, next)).catch(next)
}

export { asyncHandler }



// const asyncHandler=()=>{}
// const asyncHandler= (func) => () => {}
// const asyncHandler=(func)=>async()=>{}

// const asyncHandler = (func) => async (err, req, res, next) => {
//     try {
//         await func(req, res, next)
//     }
//     catch (error) {
//         res.staus(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }