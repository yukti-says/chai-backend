import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

/**
 * ==========================================================
 * Get all videos (with search, filtering, sorting, pagination)
 * ==========================================================
 * - Reads query params: page, limit, query, sortBy, sortType, userId
 * - Builds a "filter" object to control which videos to fetch
 *   -> If `query` given: search by title or description (case-insensitive)
 *   -> If `userId` given: show only that user’s videos
 *   -> Always: only show videos that are published
 * - Applies sorting (default: newest first), pagination (skip & limit)
 * - Returns list of videos
 */

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    //* filtering conditions for the mongodb
    const filter = {};

    //* if query given based on it we will search for title or description
    if (query) {
        filter.$or = [
            {
                title: {
                    $regex: query,
                    $options: "i"
                }
            },
                {
                    description: {
                        $regex: query,
                        $options:"i"
                    }
                }
            
        ]
    }

    //* if userid is provided, fetch only that user's vedios
    if (userId && isValidObjectId(userId)) {
        filter.owner = userId;
    }

    //* by default show only published videos
    filter.isPublished = true;

    //* applying filter + sort + pagination
    const videos = await Video.find(filter).sort({ [sortBy]: sortType === "asc" ? 1 : -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    return res.json(
        new ApiResponse(200,
            videos,
            "Videos fetched well!"
        )
    )

})

/**
 * =======================
 * Publish (upload) a video
 * =======================
 * - Requires: title, description (from body)
 * - Requires: video file and thumbnail (from req.files)
 * - Uploads both files to Cloudinary
 * - Creates a new Video document in MongoDB
 * - Associates the video with the logged-in user
 */

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    //* check for title and description if they are given or not
    if (!title || !description) {
        throw new ApiError(400,"Title and description is required!")
    }

    //* paths to upload the files from multer
    const videoPath = req?.files?.videoFile?.[0]?.path;
    const thumbPath = req?.files?.thumbnail?.[0]?.path;

    if (!videoPath || !thumbPath) {
        throw new ApiError(400,"Videos and thumbnail is needed")
    }

    //* uploading files to cloudinary
    const uploadedVideo = await uploadOnCloudinary(videoPath, "video");
    const uploadedThumb = await uploadOnCloudinary(thumbPath, "image");

    //* save the video in db
    const video = await Video.create({
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumb.url,
        title,
        description,
        duration: uploadedVideo.duration || 0,
        owner:req.user._id
    })

    return res.json(
        new ApiResponse(201,
            video,
            "Video published"
        )
    )
})

/**
 * ==================
 * Get a video by ID
 * ==================
 * - Requires: videoId (from URL params)
 * - Validates if videoId is a valid MongoDB ObjectId
 * - Finds the video in DB
 * - If not published → only the owner can see it
 * - Increments view count when video is fetched
 */

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    //*validate the video url id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid video id")
    }

    //* searching the video in the database
    const video = await Video.findById(videoId).populate("owner", "username");

    if(!video)
    {
        throw new ApiError(404,'video not found')
    }
    
    //* if a video is private only owner can access it
    if (!video.isPublished && String(video.owner._id) !== String(req.user._id)) {
        throw new ApiError(403,"this video is private")
    }

    //* increment the views count
    video.views += 1;
    await video.save();

    return res.json(new ApiResponse(200,
        video,
        "Video fetched!"
    ))
})


/**
 * ==================
 * Update a video
 * ==================
 * - Requires: videoId (from URL params)
 * - Only the owner can update their video
 * - Updates title/description if provided
 * - If new thumbnail uploaded → upload to Cloudinary and replace
 */

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    //* find video in db
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404,"Video not found")
    }

    //*check for permission only owner can update the video
    if (String(video.owner) !== String(req.user._id)) {
        throw new ApiError(403,"not allowed dude!!")
    }

    //* getting title and description from the user for updations
    const { title, description } = req.body;
 
    //* now update it
    if (title) video.title = title;
    if (description) video.description = description;


    //* if new thumbnail is given
    const thumbPath = req?.files?.thumbnail?.[0].path;
    if (thumbPath) {
        const uploadedPath = await uploadOnCloudinary(thumbPath, "image");
        video.thumbnail = uploadedPath.url
    }

    //* save 
    await video.save();

     return res.json(new ApiResponse(200, video, "Video updated"));


})


/**
 * ==================
 * Delete a video
 * ==================
 * - Requires: videoId (from URL params)
 * - Only the owner can delete their video
 * - Removes the document from MongoDB

 */

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    //* search in db
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404,"Video not found")
    }

    //* only owner can delete it so check if it is owner or not
    if (String(video.owner) !== String(req.user._id)) {
        throw new ApiError(403,"not allowed dude!")
    }

    await video.deleteOne();

    return res.json(
        new ApiResponse(200,{},"Video Deleted")
    )
})

/**
 * ==================================
 * Toggle publish status of a video
 * ==================================
 * - Requires: videoId (from URL params)
 * - Only the owner can toggle
 * - Flips `isPublished`:
 *   -> If published → make private
 *   -> If private → make published
 * - Saves and returns updated video
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    //* search the video in db
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    //* check for ownership
    if (String(video.owner) !== String(req.user._id)) {
        throw new ApiError(403,"NOt allowed dude!")
    }
    //* if it is published make it ! not unpublished

    video.isPublished = !video.isPublished;
    await video.save();
    //* return response

    return res.json(
        new ApiResponse(200,video,"published status toggled")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus


    
}
