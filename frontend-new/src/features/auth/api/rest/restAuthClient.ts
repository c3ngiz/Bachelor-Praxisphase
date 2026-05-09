import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../../config/env';
import type {
  AuthClient,
  AuthResult,
  AuthUser,
  SignInInput,
  SignUpInput,
} from '../../types/auth.types';
import { throwNormalizedApiError } from '../authApiError';
import {
  toAuthResult,
  toAuthUser,
  type BackendAuthPayload,
  type BackendAuthUser,
} from '../authMappers';
import { authTokenStorage } from '../authTokenStorage';

/** REST request body expected by the backend registration endpoint. */
interface RestRegisterRequest {
  /** New user email address. */
  email: string;
  /** New user password. */
  password: string;
  /** New user display name. */
  name: string;
  /** Backend avatar color token. */
  avatarColor: string;
}

/** REST auth API client backed by axios. */
export class RestAuthClient implements AuthClient {
  private readonly http: AxiosInstance;

  /**
   * Creates a REST auth client.
   *
   * @param baseUrl - Base URL of the REST backend.
   */
  constructor(baseUrl: string = env.restApiUrl) {
    this.http = axios.create({
      baseURL: baseUrl,
      withCredentials: true,
    });

    this.http.interceptors.request.use((config) => {
      const token = authTokenStorage.getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });
  }

  /**
   * Registers a user through `POST /api/auth/register`.
   *
   * @param input - Normalized sign-up input.
   * @returns A normalized authenticated session.
   */
  async signUp(input: SignUpInput): Promise<AuthResult> {
    try {
      const response = await this.http.post<BackendAuthPayload>(
        '/api/auth/register',
        toRestRegisterRequest(input),
      );
      return toAuthResult(response.data);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Authenticates a user through `POST /api/auth/login`.
   *
   * @param input - Normalized sign-in input.
   * @returns A normalized authenticated session.
   */
  async signIn(input: SignInInput): Promise<AuthResult> {
    try {
      const response = await this.http.post<BackendAuthPayload>('/api/auth/login', input);
      return toAuthResult(response.data);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }

  /**
   * Completes local sign-out for bearer-token REST auth.
   *
   * The current REST backend does not expose a logout endpoint.
   */
  async signOut(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Loads the authenticated user through `GET /api/auth/me`.
   *
   * @returns Current user, or null when no token is stored.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!authTokenStorage.getToken()) {
      return null;
    }

    try {
      const response = await this.http.get<{ user: BackendAuthUser }>('/api/auth/me');
      return toAuthUser(response.data.user);
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }
}

/**
 * Maps normalized sign-up input to the REST registration request body.
 *
 * @param input - Normalized sign-up input.
 * @returns REST backend registration payload.
 */
function toRestRegisterRequest(input: SignUpInput): RestRegisterRequest {
  return {
    avatarColor: input.avatarColor ?? 'bg-emerald-500',
    email: input.email,
    name: input.name,
    password: input.password,
  };
}
