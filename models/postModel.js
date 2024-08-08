import mongoose from "mongoose";

const { Schema } = mongoose;

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "Fantasy",
        "Science-Fiction",
        "Romance",
        "Mystery-Thriller",
        "Historical-Fiction",
        "Non-Fiction",
        "Young-Adult",
        "Children's-Books",
        "Anime-Manga",
        "Novels-Comics",
      ],
      message: "{VALUE} is not a valid category",
    },
    description: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    thumbnail: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", PostSchema);

export default Post;
