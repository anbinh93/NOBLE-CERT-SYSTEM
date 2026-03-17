import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  pages: {
    signIn: '/login', // Adjust if you have a custom login page
    newUser: '/signup' 
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/manager');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // Optional: Redirect logged-in users away from login page
        // if (nextUrl.pathname.startsWith('/login')) {
        //   return Response.redirect(new URL('/dashboard', nextUrl));
        // }
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
