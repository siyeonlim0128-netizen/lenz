import { apiRequest } from './client'

export interface SignupRequest {
  email: string
  password: string
  name: string
  school: string
  major: string
  grade: string
  interestedJobs: string[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user?: {
    id: string
    email: string
    name: string
    school: string
    grade: string
    interestedJobs: string[]
  }
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
