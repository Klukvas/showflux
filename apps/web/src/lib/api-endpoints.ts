export const endpoints = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
  },
  users: {
    me: "/users/me",
    changePassword: "/users/me/change-password",
    list: "/users",
    deactivate: (id: string) => `/users/${id}/deactivate`,
    reactivate: (id: string) => `/users/${id}/reactivate`,
  },
  workspace: {
    get: "/workspace",
    update: "/workspace",
  },
  listings: {
    list: "/listings",
    create: "/listings",
    get: (id: string) => `/listings/${id}`,
    update: (id: string) => `/listings/${id}`,
    delete: (id: string) => `/listings/${id}`,
  },
  showings: {
    list: "/showings",
    create: "/showings",
    get: (id: string) => `/showings/${id}`,
    update: (id: string) => `/showings/${id}`,
    delete: (id: string) => `/showings/${id}`,
  },
  offers: {
    list: "/offers",
    create: "/offers",
    get: (id: string) => `/offers/${id}`,
    update: (id: string) => `/offers/${id}`,
    delete: (id: string) => `/offers/${id}`,
  },
  invites: {
    list: "/invites",
    create: "/invites",
    accept: (token: string) => `/invites/${token}/accept`,
    revoke: (id: string) => `/invites/${id}`,
  },
  activity: {
    list: "/activity",
  },
  dashboard: {
    summary: "/dashboard/summary",
  },
  subscription: {
    status: "/subscription",
    checkout: "/subscription/checkout",
    cancel: "/subscription/cancel",
    updatePlan: "/subscription/update-plan",
  },
} as const;
