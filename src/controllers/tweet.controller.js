import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


/**
 * ===========================
 * CREATE A TWEET
 * ===========================
 */
const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    //* get the content from req.body
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "content is required");
    }
    //* now creating a tweet document with provided content and logged in user as owner
    const tweet = await Tweet.create({
        content,
        owner:req.user._id,
    })

    //* send response with the newly created tweet
    return res
    .json(new ApiResponse(201,tweet,"Tweet created!"))
})

/**
 * ===========================
 * GET ALL TWEETS
 * ===========================
 */
const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    //* fetching all the tweets
    const tweets = await Tweet.find().populate("owner", "username avatar fullname") //* populated owner field with user details
        .sort({ createdAt: -1 }); //* sorted tweets latest first
    
    return res.json(new ApiResponse(200,tweets,"all tweets fetched!"))
})

/**
 * ===========================
 * GET SINGLE TWEET BY ID
 * ===========================
 */
const singleTweetById = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;

    //* find tweets by id and fetch its owner details
    const tweet = await Tweet.findById(tweetId).populate("owner", "username avatar fullname");

    if (!tweet) {
        throw new ApiError(404,"Tweet not found")
    }

    return res.json(new ApiResponse(200,tweet,"Tweet fetched"))
})

/**
 * ===========================
 * UPDATE A TWEET
 * ===========================
 */

const updateTweet = asyncHandler(async (req, res) => {
    //* get tweet if from url and content from req.body
    const { tweetId } = req.params;
    const { content } = req.body;

    //* find tweet in db
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404,"Tweet not found")
    }

    //* ensuring only the owner can update the tweet
    if (tweet.owner.toString() != req.user._id.toString()) {
        throw new ApiError(403,"You can only update your own tweets")
    }

    //* now update the tweets if new content is given
    tweet.content = content || tweet.content;
    await tweet.save() //? save changes

    return res.json(new ApiResponse(200,tweet,"Tweet Updated!"))
})

/**
 * ===========================
 * DELETE A TWEET
 * ===========================
 */
const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params;
    //* find tweet in db
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404,"Tweet not found")
    }

    //* ensuring only owner can delete its tweets
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403,"you can only delete your own tweets")
    }

    //* delete the tweet
    await tweet.deleteOne();

    return res.json(new ApiResponse(200,{},"Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    singleTweetById
}
