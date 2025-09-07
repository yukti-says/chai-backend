import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { isValidObjectId } from "mongoose";


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    //* validate channel id
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400,"Invalid channel ID")
    }

    //* ensure channel exist in the db
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    //* prevent subscribing to ourself
    if (channelId === req.user._id.toString()) {
        throw new ApiError(400,"You can not subscribe your own self")
    }

    //* check for already subscribed
    const existingSub = await Subscription.findOne({
        subscriber: req.user._id,
        channel:channelId
    })

    if (existingSub) {
        
        //? if subscriber is there so ->unsubscribe (delete)
        await Subscription.findByIdAndDelete(existingSub._id)
        return res
            .status(200)
        .json(new ApiResponse(200,null,"Unsubscribed successful!"))
    }
    else {
        //? if subscription does not there si subscribe->create one
        const newSub = await Subscription.create({
            subscriber: req.user._id,
            channel:channelId
        })

        return res
            .status(201)
        .json(new ApiResponse(201,newSub,"Subscribed Successful"))
        
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    
    //* validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400,"invalid channel ID")
    }

    //* finding all subscriber where channel matches channelId
    const subscriber = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username email")
        .exec()
    
    return res
        .status(200)
    .json(new ApiResponse(200,subscriber,"channel subscribers fetched"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400,"invalid subscriber ID")
    }

    //* finding all subscriptions where subscriber matches subscriberId
    const channels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username email")
        .exec();
    
    return res
        .status(200)
    .json(new ApiResponse(200,channels,"subscribed channels fetched"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}