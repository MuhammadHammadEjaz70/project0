import { asyncHandler } from '../utils/asyncHandler.js'


const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "Hammad Gujjar is the best man in the world"
    })
})


export {registerUser}