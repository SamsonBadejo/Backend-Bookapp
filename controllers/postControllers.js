import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import HttpError from "../models/errorModel.js";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import { dirname } from "path";


// Create Post
// GET: /api/posts
const createPost = async (req, res, next) => {
  try {
    let { title, category, description } = req.body;
    if (!title || !category || !description || !req.files) {
      return next(new HttpError("Please fill in all fields", 422));
    }

    const { thumbnail } = req.files;
    // check file size
    if (thumbnail.size > 1024 * 1024 * 5) {
      return next(new HttpError("File size too large", 422));
    }

    let fileName = thumbnail.name;
    let splittedFilename = fileName.split(".");
    let newFilename = `${
      splittedFilename[0]
    }_${uuidv4()}.${splittedFilename.pop()}`;
    thumbnail.mv(path.resolve("uploads", newFilename), async (error) => {
      if (error) {
        return next(new HttpError(error));
      } else {
        const newPost = await Post.create({
          title,
          category,
          description,
          creator: req.user.id,
          thumbnail: newFilename,
        });
        if (!newPost) {
          return next(new HttpError("Post couldn't be created", 422));
        }
        // find user and increase post count
        const currentUser = await User.findById(req.user.id);
        const userPostCount = currentUser.posts + 1;
        await User.findByIdAndUpdate(req.user.id, { posts: userPostCount });

        res.status(201).json(newPost);
      }
    });
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Get all Posts
// GET: /api/posts
// UNPROTECTED
const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ updatedAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Get Single Post
// GET: /api/posts/:id
// UNPROTECTED
const getPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found", 404));
    }

    res.status(200).json(post);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Get User Posts By Category
// GET: /api/posts/category/:category
// UNPROTECTED
const getCategoryPosts = async (req, res, next) => {
  try {
    const { category } = req.params;
    const categoryPosts = await Post.find({ category }).sort({ createdAt: -1 });
    res.status(200).json(categoryPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Get Post BY The Author
// GET: /api/posts/users/:id
// UNPROTECTED

const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userPosts = await Post.find({ creator: id }).sort({ createdAt: -1 });
    res.status(200).json(userPosts);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// Edit Post
// Patch: /api/posts/:id
// PROTECTED

// Edit Post
// Patch: /api/posts/:id
// PROTECTED

const editPost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const { title, category, description } = req.body;

    if (!title || !category || description.length < 12) {
      return next(new HttpError("Please fill in all fields", 422));
    }

    let updatedPost;

    if (!req.files || !req.files.thumbnail) {
      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, description },
        { new: true }
      );
    } else {
      const oldPost = await Post.findById(postId);
      if (!oldPost) {
        return next(new HttpError("Post not found", 404));
      }

      if (oldPost.thumbnail) {
        const oldThumbnailPath = path.resolve("uploads", oldPost.thumbnail);
        try {
          await fs.unlink(oldThumbnailPath);
        } catch (error) {
          console.error("Error deleting old thumbnail:", error); // Debugging line
        }
      }

      const { thumbnail } = req.files;

      if (thumbnail.size > 1024 * 1024 * 5) {
        return next(new HttpError("File size too large", 422));
      }

      const filename = thumbnail.name;
      const splittedFilename = filename.split(".");
      const newFilename = `${
        splittedFilename[0]
      }_${uuidv4()}.${splittedFilename.pop()}`;

      const newFilePath = path.resolve("uploads", newFilename);
      await thumbnail.mv(newFilePath);

      updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, category, description, thumbnail: newFilename },
        { new: true }
      );
    }

    if (!updatedPost) {
      return next(new HttpError("Post couldn't be updated", 400));
    }

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error); // Debugging line
    return next(new HttpError("Error updating post", 500));
  }
};

// Delete Post
// DELETE: /api/posts/:id
// PROTECTED

const __dirname = dirname(fileURLToPath(import.meta.url));

const deletePost = async (req, res, next) => {
  try {
    const postId = req.params.id;
    if (!postId) {
      return next(new HttpError("Post not found", 404));
    }

    const post = await Post.findById(postId);
    if (!post) {
      return next(new HttpError("Post not found", 404));
    }

    const filename = post.thumbnail;
    if (filename) {
      try {
        await fs.unlink(path.join(__dirname, "..", "uploads", filename));
      } catch (error) {
        console.error("Error deleting thumbnail:", error); // Debugging line
        return next(new HttpError("Error deleting thumbnail", 500));
      }
    }

    await Post.findByIdAndDelete(postId);

    // Find user and decrease post count
    const currentUser = await User.findById(req.user.id);
    if (currentUser) {
      currentUser.posts = currentUser.posts - 1;
      await currentUser.save();
    }

    res.status(200).json(`Post ${postId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting post:", error); // Debugging line
    return next(new HttpError("Error deleting post", 500));
  }
};


export {
  createPost,
  getPosts,
  getPost,
  getCategoryPosts,
  getUserPosts,
  editPost,
  deletePost,
};
