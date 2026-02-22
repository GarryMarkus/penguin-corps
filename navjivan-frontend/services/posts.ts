import API from "./api";
import { Post } from "../types/post";

export const fetchFeed = (page = 1, limit = 10) =>
  API.get<{ success: boolean; page: number; limit: number; posts: Post[] }>(
    `/api/posts/feed?page=${page}&limit=${limit}`
  );

export const fetchMyPosts = (userId: string) =>
  API.get<{ success: boolean; posts: Post[] }>(`/api/posts/user/${userId}`);

export const toggleLike = (postId: string) => API.post(`/api/posts/${postId}/like`);

export const createPost = (formData: FormData) =>
  API.post("/api/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deletePost = (postId: string) => API.delete(`/api/posts/${postId}`);

export const fetchComments = (postId: string) =>
  API.get(`/api/comments/${postId}`);

export const createComment = (postId: string, content: string) =>
  API.post(`/api/comments/${postId}`, { content });

export const deleteComment = (commentId: string) =>
  API.delete(`/api/comments/delete/${commentId}`);
