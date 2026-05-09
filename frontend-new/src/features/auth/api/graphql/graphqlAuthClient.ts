import axios, { type AxiosInstance } from 'axios';

import { env } from '../../../../config/env';
import type {
  AuthClient,
  AuthResult,
  AuthUser,
  SignInInput,
  SignUpInput,
} from '../../types/auth.types';
import { NormalizedApiError, throwNormalizedApiError } from '../authApiError';
import {
  toAuthResult,
  toAuthUser,
  type BackendAuthPayload,
  type BackendAuthUser,
} from '../authMappers';
import { authTokenStorage } from '../authTokenStorage';
import { meQuery, signInMutation, signUpMutation } from './authDocuments';

/** GraphQL response envelope returned by the backend. */
interface GraphqlResponse<TData> {
  /** Operation data when the request succeeds. */
  data?: TData;
  /** Operation errors when GraphQL execution fails. */
  errors?: Array<{ message: string }>;
}

/** GraphQL request body sent through axios. */
interface GraphqlRequest<TVariables> {
  /** GraphQL document string. */
  query: string;
  /** Variables referenced by the GraphQL document. */
  variables?: TVariables;
}

/** GraphQL auth API client backed by axios. */
export class GraphqlAuthClient implements AuthClient {
  private readonly http: AxiosInstance;

  /**
   * Creates a GraphQL auth client.
   *
   * @param endpointUrl - Full URL of the GraphQL endpoint.
   */
  constructor(endpointUrl: string = env.graphqlApiUrl) {
    this.http = axios.create({
      baseURL: endpointUrl,
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
   * Registers a user through the `register` GraphQL mutation.
   *
   * @param input - Normalized sign-up input.
   * @returns A normalized authenticated session.
   */
  async signUp(input: SignUpInput): Promise<AuthResult> {
    const data = await this.request<{ register: BackendAuthPayload }, { input: SignUpInput }>(
      signUpMutation,
      {
        input: {
          avatarColor: input.avatarColor ?? 'bg-emerald-500',
          email: input.email,
          name: input.name,
          password: input.password,
        },
      },
    );

    return toAuthResult(data.register);
  }

  /**
   * Authenticates a user through the `login` GraphQL mutation.
   *
   * @param input - Normalized sign-in input.
   * @returns A normalized authenticated session.
   */
  async signIn(input: SignInInput): Promise<AuthResult> {
    const data = await this.request<{ login: BackendAuthPayload }, { input: SignInInput }>(
      signInMutation,
      {
        input,
      },
    );

    return toAuthResult(data.login);
  }

  /**
   * Completes local sign-out for bearer-token GraphQL auth.
   *
   * The current GraphQL backend does not expose a logout mutation.
   */
  async signOut(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Loads the authenticated user through the `me` GraphQL query.
   *
   * @returns Current user, or null when no token is stored.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (!authTokenStorage.getToken()) {
      return null;
    }

    const data = await this.request<{ me: BackendAuthUser }, undefined>(meQuery);
    return toAuthUser(data.me);
  }

  /**
   * Executes a GraphQL request and normalizes transport or GraphQL errors.
   *
   * @param query - GraphQL document string.
   * @param variables - Optional GraphQL variables.
   * @returns Typed GraphQL operation data.
   */
  private async request<TData, TVariables>(query: string, variables?: TVariables): Promise<TData> {
    try {
      const response = await this.http.post<
        GraphqlResponse<TData>,
        { data: GraphqlResponse<TData> },
        GraphqlRequest<TVariables>
      >('', { query, variables });

      if (response.data.errors?.length) {
        throw new NormalizedApiError({
          message: response.data.errors[0]?.message ?? 'GraphQL request failed. Please try again.',
        });
      }

      if (!response.data.data) {
        throw new NormalizedApiError({ message: 'GraphQL response did not include data.' });
      }

      return response.data.data;
    } catch (error) {
      throwNormalizedApiError(error);
    }
  }
}
