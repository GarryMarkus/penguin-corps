export interface PostAuthor {
  _id: string;
  name: string;
  email?: string;
}

export interface PostImage {
  url: string;
  public_id: string;
}

export interface Post {
  _id: string;
  author: PostAuthor;
  content: string;
  images: PostImage[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface FeedResponse {
  success: boolean;
  page: number;
  limit: number;
  posts: Post[];
}
