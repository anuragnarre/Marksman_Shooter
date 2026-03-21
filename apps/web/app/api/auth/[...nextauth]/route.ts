import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.googleId = account.providerAccountId;
        token.name = profile.name;
        token.email = profile.email;

        // Sync the Google user to the NestJS backend on first sign-in
        try {
          const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: profile.email,
              name: profile.name,
              googleId: account.providerAccountId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.backendToken = data.access_token;
            token.backendUser = data.user;
          }
        } catch {
          // Backend sync failed — user can retry
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).googleId = token.googleId as string;
        (session as any).backendToken = token.backendToken;
        (session as any).backendUser = token.backendUser;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
