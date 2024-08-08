import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Adding uniqueness constraint
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  posts: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt timestamps
});

const User = mongoose.model('User', userSchema);

export default User;
