/** User fields shared by GraphQL auth operations. */
const authUserFields = `
  id
  email
  name
  initials
  avatarColor
  createdAt
  updatedAt
`;

/** GraphQL mutation used to register a new user. */
export const signUpMutation = `
  mutation SignUp($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        ${authUserFields}
      }
    }
  }
`;

/** GraphQL mutation used to authenticate an existing user. */
export const signInMutation = `
  mutation SignIn($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        ${authUserFields}
      }
    }
  }
`;

/** GraphQL query used to load the current authenticated user. */
export const meQuery = `
  query Me {
    me {
      ${authUserFields}
    }
  }
`;
