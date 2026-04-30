// Web API service — same endpoints as the mobile app
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.lannalashes.com';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ll_token');
}

async function request<T>(method: string, path: string, body?: object): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export const apiGet    = <T>(path: string)               => request<T>('GET',    path);
export const apiPost   = <T>(path: string, body: object)  => request<T>('POST',   path, body);
export const apiPut    = <T>(path: string, body: object)  => request<T>('PUT',    path, body);
export const apiDelete = <T>(path: string)               => request<T>('DELETE', path);

export interface Course {
  id: string; title: string; slug: string; description: string; shortDescription: string;
  thumbnail: string; previewVideoUrl: string; price: number; compareAtPrice: number | null;
  level: 'beginner' | 'intermediate' | 'advanced'; category: string;
  totalLessons: number; totalDurationMinutes: number; enrolledCount: number;
  rating: number; ratingCount: number;
  instructor: { name: string; avatar: string; bio: string };
  modules: { id: string; title: string; lessons: { id: string; title: string; durationMinutes: number; isPreview: boolean; isCompleted?: boolean }[] }[];
  tags: string[];
}

export interface Post {
  id: string;
  author: { id: string; firstName: string; lastName: string; avatar: string | null };
  content: string; images: string[]; tag: string;
  likeCount: number; commentCount: number; isLiked: boolean; createdAt: string;
}

export interface Comment {
  id: string;
  author: { id: string; firstName: string; lastName: string; avatar: string | null };
  content: string; likeCount: number; isLiked: boolean; createdAt: string;
}

export const CourseAPI = {
  list:  (filter?: { level?: string; category?: string }) =>
    apiGet<Course[]>(`/api/courses?${new URLSearchParams(filter as any)}`),
  get:   (slug: string) => apiGet<Course>(`/api/courses/${slug}`),
  myEnrollments: () => apiGet<any[]>('/api/enrollments'),
  getEnrollment: (courseId: string) => apiGet<any>(`/api/enrollments/${courseId}`),
};

export const CommunityAPI = {
  getPosts: (tag?: string, cursor?: string) =>
    apiGet<{ posts: Post[]; nextCursor: string | null }>(
      `/api/community/posts?${new URLSearchParams({ ...(tag ? { tag } : {}), ...(cursor ? { cursor } : {}) })}`
    ),
  createPost: (content: string, tag: string, images?: string[]) =>
    apiPost<Post>('/api/community/posts', { content, tag, images }),
  likePost:   (postId: string) => apiPost(`/api/community/posts/${postId}/like`, {}),
  getComments:(postId: string) => apiGet<Comment[]>(`/api/community/posts/${postId}/comments`),
  addComment: (postId: string, content: string) =>
    apiPost<Comment>(`/api/community/posts/${postId}/comments`, { content }),
  getStats:   () => apiGet<{ memberCount: number; postsToday: number; liveNow: number }>('/api/community/stats'),
};
