import { signToken } from '@vercel/kms';

export async function GET(): Promise<Response> {
  const token = await signToken({
    issuerId: '78d0d2fc-fc21-4102-9ca6-0dc1483154c6',
    claims: {
      accountId: 'acct_123',
      role: 'admin',
    },
  });

  return Response.json({ token });
}
