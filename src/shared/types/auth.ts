export type LoginResponseBody = {
  accessToken: string;
};

export type LoginUser = {
  userId: string;
  displayName: string;
  email: string;
  passwordChangedAt: string;
  roles: string[];
};
