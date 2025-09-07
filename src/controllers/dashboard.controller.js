import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


/**
 * ===========================
 * GET CHANNEL STATS
 * ===========================
 * - Total videos uploaded by the channel
 * - Total views across all videos
 * - Total likes across all videos
 * - Total subscribers
 */
const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
//* get the current user id as logged in user's channel id
    const { channelId } = req.user._id;

    //* validate the channel id
    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400,"invalid channel ID")
    }

    //* total videos uploaded
    const totalVideos = await Video.countDocuments({ owner: channelId });

    //* total views across all videos of this channel
    const totalViewsAgg = await Video.aggregate([
        {
            $match: {
                owner:channelId
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum:"$views" //?sum of all views
                }
            }
        }
    ])

    const totalViews = totalViewsAgg[0]?.totalViews || 0;

    //* total likes across all the videos of this channel
    const totalLikes = await Like.countDocuments({
        video: {
            $in: await Video.find({ owner: channelId }).distinct("_id")
        }
    });

    //* total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    //* combine stats in one object
    const stats = {
        totalLikes,
        totalSubscribers,
        totalVideos,
        totalViews
    }

    return res
    .json(new ApiResponse(200,stats,"Channel stats given to you!"))
})
/**
 * ===========================
 * GET ALL VIDEOS OF A CHANNEL
 * ===========================
 */
const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const { channelId } = req.params;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400,"Invalid channel Id")
    }

    //* fetch all the video uploaded by this channel

    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 })
        .populate('owner', "username avatar fullname")
    
    //* if not videos found
    if (!videos.length) {
        throw new ApiError(404,"No videos found for this channel")
    }

    return res
    .json(new ApiResponse(200,videos,"channel videos fetched successfu;"))
})

export {
    getChannelStats, 
    getChannelVideos
    }