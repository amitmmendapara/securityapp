// ─────────────────────────────────────────────────────────────
// COPY TO: frontend/src/api/post.api.js
// ─────────────────────────────────────────────────────────────
import apiClient from "./axiosClient"; // already exists in your project

// Create a new post
export const createPostApi = (data) =>
  apiClient.post("/api/posts", data);

// Get public posts feed (paginated)
export const getPublicPostsApi = (page = 1, limit = 10) =>
  apiClient.get(`/api/posts?page=${page}&limit=${limit}`);

// Get my own posts
export const getMyPostsApi = (page = 1, limit = 10) =>
  apiClient.get(`/api/posts/mine?page=${page}&limit=${limit}`);

// Get single post
export const getPostByIdApi = (id) =>
  apiClient.get(`/api/posts/${id}`);

// Update a post
export const updatePostApi = (id, data) =>
  apiClient.put(`/api/posts/${id}`, data);

// Delete a post
export const deletePostApi = (id) =>
  apiClient.delete(`/api/posts/${id}`);
