import { v2 as cloudinary } from 'cloudinary';

import fs from 'fs'

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUNDINARY_CLOUD_NAME,
    api_key: process.env.CLOUNDINARY_API_KEY,
    api_secret: process.env.CLOUNDINARY_API_SECERT
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // upload the file
        const res = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file has been uploaded successfully
        // console.log("File is uploaded on cloudinary ", res.url);
        // console.log("File is uploaded on cloudinary ", res);
        fs.unlinkSync(localFilePath)
        return res;


    } catch (error) {
        fs.unlinkSync(localFilePath)
        //remove the locally saved temporariy file as the upload operation got failed
        console.log(error);
        return null;
    }
}

const deleteFromCloudinary = async (localFilePath) => {
    const parts = localFilePath.split('/');
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    try {
        if (!publicId) {
            return null;
        }
        await cloudinary.uploader.destroy(publicId)

    } catch (error) {
        console.log(error)
    }
}

export const deleteVideoFromCloudinary = async (localFilePath) => {
    const parts = localFilePath.split('/');
    const publicIdWithExtension = parts[parts.length - 1];
    const publicId = publicIdWithExtension.split('.')[0];
    try {
        if (!publicId) {
            return null;
        }
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video', })

    } catch (error) {
        console.log(error)
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }

// (async function () {

//     // Optimize delivery by resizing and applying auto-format and auto-quality
//     const optimizeUrl = cloudinary.url('shoes', {
//         fetch_format: 'auto',
//         quality: 'auto'
//     });

//     console.log(optimizeUrl);

//     // Transform the image: auto-crop to square aspect_ratio
//     const autoCropUrl = cloudinary.url('shoes', {
//         crop: 'auto',
//         gravity: 'auto',
//         width: 500,
//         height: 500,
//     });

//     console.log(autoCropUrl);
// })();s