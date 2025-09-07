import mongoose, { mongo } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

/**
 * ===========================
 * GET ALL COMMENTS FOR A VIDEO
 * ===========================
 */

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params //* from url
    const { page = 1, limit = 10 } = req.query //*extracted pagination values from query

    //* validating if videoId is a valid MongoDb ObjectId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid videoId")
    }

    //* aggregation plugin to fetch comments with owner details
    const comments = await Comment.aggregatePaginate(
        Comment.aggregate([
            //* match the comments that is belonging to that video
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            //* sort the comments by latest first
            {
                $sort: {
                    createdAt: -1
                }
            },
            //* lookup find throw joining users to get owner details
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            //* convert the owner array to abject
            {
                $unwind: "$owner"
            },
            //* now project-> return only selected values
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    "owner.username": 1,
                    "owner.avatar": 1,
                    "owner.fullname": 1,
                }
            }
        ]),
        { page, limit }
    );

    return res.json(new ApiResponse(200,comments,"comments fetched successfully"))
    

})


/**
 * ===========================
 * ADD A COMMENT TO A VIDEO
 * ===========================
 */

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    //* getting the video id and content
    const { videoId } = req.params;
    const { content } = req.body;

    //* validate input
    if (!content) {
        throw new ApiError(400,"Comment content is required")
    }

    //*  validate the videoId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400,"Invalid Video ID")
    }

    //* creating a new comment document

    const comment = await Comment.create({
        content,
        video: videoId,
        owner:req.user._id //? only logged in user can create the comment 
    })

    return res.json(new ApiResponse(201,comment,"comment Added!"))
})

/**
 * ===========================
 * UPDATE A COMMENT
 * ===========================
 */

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  //* Find the comment by ID
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  //* Ensuring  only the comment owner can update it
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own comments");
  }

  //* Update comment content
  comment.content = content || comment.content;
    await comment.save();
    

    return res.json(new ApiResponse(200, comment, "Comment updated successfully"));
});

/**
 * ===========================
 * DELETE A COMMENT
 * ===========================
 */
const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    
    //* find the comment in the db
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404,"comment not found")
    }

    //* ensuring only owner can delete its comments
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403,"You can only delete your own comments")
    }

    await comment.deleteOne();

    return res.json(new ApiResponse(200, {}, "Comment deleted successfully"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
