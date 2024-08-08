import { Router } from "express"; // Corrected import for Router
import {
  getPosts,
  getPost,
  getCategoryPosts,
  getUserPosts,
  createPost,
  editPost,
  deletePost,
} from "../controllers/postControllers.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router(); // Create a new router instance

// Routes for posts
router.post("/", authMiddleware, createPost);   
router.get("/", getPosts);
router.get("/:id", getPost);
router.get("/categories/:category", getCategoryPosts);
router.get("/users/:id", getUserPosts);
router.patch("/:id", authMiddleware, editPost);
router.delete("/:id", authMiddleware, deletePost);

export default router;
