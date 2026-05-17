import { apiRequest } from './client'

export interface UserProfile {
  id: string
  email: string
  name: string
  school: string
  grade: string
  interestedJobs: string[]
  createdAt?: string
}

export interface UpdateProfileRequest {
  name?: string
  school?: string
  grade?: string
  interestedJobs?: string[]
}

export interface BookmarkRequest {
  postingId: string
  postingData?: {
    company: string
    title: string
    tags: string[]
  }
}

export async function getProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/api/user/me')
}

export async function updateProfile(data: UpdateProfileRequest): Promise<void> {
  await apiRequest('/api/user/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function getBookmarks(): Promise<Record<string, unknown>[]> {
  return apiRequest<Record<string, unknown>[]>('/api/user/bookmarks')
}

export async function addBookmark(data: BookmarkRequest): Promise<void> {
  await apiRequest('/api/user/bookmarks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteBookmark(postingId: string): Promise<void> {
  await apiRequest(`/api/user/bookmarks/${postingId}`, { method: 'DELETE' })
}

export async function getHistory(): Promise<Record<string, unknown>[]> {
  return apiRequest<Record<string, unknown>[]>('/api/user/history')
}

export async function getCoverLetters(): Promise<Record<string, unknown>[]> {
  return apiRequest<Record<string, unknown>[]>('/api/user/cover-letters')
}
