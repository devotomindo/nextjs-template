import { createPost } from "@/features/EXAMPLE-post/routes/create-post";
import { deletePost } from "@/features/EXAMPLE-post/routes/delete-post";
import { listAllPosts } from "@/features/EXAMPLE-post/routes/list-all-posts";
import { updatePost } from "@/features/EXAMPLE-post/routes/update-post";

const postRouter = {
  listAllPosts,
  createPost,
  updatePost,
  deletePost,
};

export default postRouter;
