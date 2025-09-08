import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { isValidObjectId } from "mongoose"

/**
 * ===========================
 * CREATE A PLAYLIST
 * ===========================
 */
const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "name and description is needed");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully!"));
})


/**
 * ===========================
 * GET ALL PLAYLISTS OF A USER
 * ===========================
 */
const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!isValidObjectId(userId)) {
        throw new ApiError(400,"Invalid user ID")
    }

    const playlists = await Playlist.find({ owner: userId }).populate("videos")
    
    return res
        .status(200)
    .json(new ApiResponse(200,playlists,"User playlists fetched successfully!"))
})


/**
 * ===================
 * GET PLAYLIST BY ID
 * ===================
 */
const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400,"Invalid playlist ID")
    }
    const playlist = await Playlist.findById(playlistId).populate("videos")
    
    if (!playlist) {
        throw new ApiError(404,"Playlist not found")
    }

    return res
        .status(200)
    .json(new ApiResponse(200,playlist,"Playlist fetched successfully!"))
})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

/**
 * ===========================
 * REMOVE VIDEO FROM PLAYLIST
 * ===========================
 *  Private (only owner can modify their playlist)
 */
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID or video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only modify your own playlist");
  }
  //* Remove the video (matching videoId) from the playlist.videos array by filtering it out
  playlist.videos = playlist.videos.filter(
    (id) => id.toString() !== videoId.toString()
  );

   await playlist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlist, "Video removed from playlist success")
    );
})


/**
 * ===========================
 * DELETE PLAYLIST
 * ===========================

 * Private (only owner can delete their playlist)
 */
const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own playlists")
    }

    await playlist.deleteOne()

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Playlist deleted successfully"))
})

/**
 * ===========================
 * UPDATE PLAYLIST
 * ===========================
 *  Private (only owner can update their playlist)
 */
const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can only update your own playlists");
    }

    playlist.name = name || playlist.name;
    playlist.description = description || playlist.description;
    await playlist.save();

    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
