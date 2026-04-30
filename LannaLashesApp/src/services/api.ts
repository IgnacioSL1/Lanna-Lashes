/**
 * Custom backend API service
 * Handles courses, community, auth, and HubSpot sync
 *
 * Setup: LANNA_API_URL=https://api.lannalashes.com in .env
 */
import { useAuthStore } from '../store/authStore';

const BASE_URL = process.env.LANNA_API_URL ?? 'https://api.lannalashes.com';

async function request<T>(
  method: string,
  path: string,
  body?: object,
): Promise<T> {
  const token = useAuthStore.getState().token;
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

export const apiGet  = <T>(path: string)              => request<T>('GET',    path);
export const apiPost = <T>(path: string, body: object) => request<T>('POST',   path, body);
export const apiPut  = <T>(path: string, body: object) => request<T>('PUT',    path, body);
export const apiDel  = <T>(path: string)              => request<T>('DELETE', path);

// ─── Courses ─────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  previewVideoUrl: string;
  price: number;
  compareAtPrice: number | null;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  totalLessons: number;
  totalDurationMinutes: number;
  enrolledCount: number;
  rating: number;
  ratingCount: number;
  instructor: { name: string; avatar: string; bio: string };
  modules: CourseModule[];
  tags: string[];
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  durationMinutes: number;
  videoUrl: string;         // Mux playback URL
  isPreview: boolean;
  isCompleted?: boolean;
  progress?: number;        // 0-100
}

export interface Enrollment {
  id: string;
  courseId: string;
  userId: string;
  enrolledAt: string;
  progressPercent: number;
  completedAt: string | null;
  certificateUrl: string | null;
  lastWatchedLessonId: string | null;
}

export const CourseAPI = {
  list: (filter?: { level?: string; category?: string }) =>
    apiGet<Course[]>(`/courses?${new URLSearchParams(filter as any)}`),

  get: (slug: string) =>
    apiGet<Course>(`/courses/${slug}`),

  enroll: (courseId: string, paymentMethodId: string) =>
    apiPost<Enrollment>('/enrollments', { courseId, paymentMethodId }),

  getEnrollment: (courseId: string) =>
    apiGet<Enrollment>(`/enrollments/${courseId}`),

  myEnrollments: () =>
    apiGet<Enrollment[]>('/enrollments'),

  trackProgress: (lessonId: string, progressSeconds: number) =>
    apiPost('/progress', { lessonId, progressSeconds }),

  markComplete: (lessonId: string) =>
    apiPost('/progress/complete', { lessonId }),
};

// ─── Community ───────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  author: { id: string; firstName: string; lastName: string; avatar: string | null };
  content: string;
  images: string[];
  tag: 'question' | 'inspo' | 'my_work' | 'tip' | 'general';
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  author: { id: string; firstName: string; lastName: string; avatar: string | null };
  content: string;
  likeCount: number;
  isLiked: boolean;
  createdAt: string;
}

export const CommunityAPI = {
  getPosts: (tag?: string, cursor?: string) =>
    apiGet<{ posts: Post[]; nextCursor: string | null }>(
      `/community/posts?${new URLSearchParams({ ...(tag ? { tag } : {}), ...(cursor ? { cursor } : {}) })}`
    ),

  createPost: (content: string, tag: string, images?: string[]) =>
    apiPost<Post>('/community/posts', { content, tag, images }),

  likePost: (postId: string) =>
    apiPost(`/community/posts/${postId}/like`, {}),

  getComments: (postId: string) =>
    apiGet<Comment[]>(`/community/posts/${postId}/comments`),

  addComment: (postId: string, content: string) =>
    apiPost<Comment>(`/community/posts/${postId}/comments`, { content }),

  getStats: () =>
    apiGet<{ memberCount: number; postsToday: number; liveNow: number }>('/community/stats'),
};

// ─── HubSpot sync (called automatically by backend on key events) ─────────────
// These endpoints trigger the backend to fire a HubSpot webhook.
// You do NOT need to call these manually — the backend handles them.
// They are listed here for documentation purposes.
//
//   POST /hubspot/identify   → on user signup
//   POST /hubspot/event      → on course purchase, completion, shop order
