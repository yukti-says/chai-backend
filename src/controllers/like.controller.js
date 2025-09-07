import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { isValidObjectId } from "mongoose"


/**
 * ===========================
 * TOGGLE LIKE ON A VIDEO
 * ===========================
 * - If user already liked → unlike (remove like)
 * - If not liked yet → like (create new like)
 */
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    //* validations
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid video ID")
    }

    //* check of the like already exists
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
        
    })
    if (existingLike) {
        //* already liked ->remove it by deleting 
        await existingLike.deleteOne();
        return res.json(new ApiResponse(200,{},"Video unliked done"))
    }
    
    //* not liked yet-> create new like
    await Like.create({
        video:videoId,
        likedBy:req.user._id
    })

    return res.json(new ApiResponse(200,{},"Video liked successfully"))


})


/**
 * ===========================
 * TOGGLE LIKE ON A COMMENT
 * ===========================
 */
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400,"Invalid comment id")
    }

    //* check if the like alreadt exists
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy:req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne();
        return res.json(new ApiResponse(200,{}," comment unlike successful"))
    }

    await Like.create({
        comment: commentId,
        likedBy:req.user._id
    })

    return res.json(new ApiResponse(200,{},"Comment Liked successfully"))
})


/**
 * ===========================
 * TOGGLE LIKE ON A TWEET
 * ===========================
 */
const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    //* Validate tweetId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  //* Check if like already exists
  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res.json(new ApiResponse(200, {}, "Tweet unliked successfully"));
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  return res.json(new ApiResponse(200, {}, "Tweet liked successfully"));
});

/**
 * ===========================
 * GET ALL LIKED VIDEOS BY USER
 * ===========================
 */
const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    //* finding all the 'like' documents where current user liked a video

    const likedVideos = await Like.find({
        likedBy: req.user._id,
        video: {
            $exists:true
        }
    }).populate("video")

    return res.json(new ApiResponse(200,likedVideos , "Liked videos fetched successful"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}