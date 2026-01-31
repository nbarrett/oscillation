import { createTRPCRouter, publicProcedure } from '../trpc';

export const tokenRouter = createTRPCRouter({
  getOSToken: publicProcedure.query(async () => {
    const key = process.env.OS_MAPS_API_KEY;
    const secret = process.env.OS_MAPS_API_SECRET;

    if (!key || !secret) {
      return {
        access_token: key ?? '',
        expires_in: '',
        issued_at: '',
        token_type: 'Bearer',
      };
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    const authString = Buffer.from(`${key}:${secret}`).toString('base64');

    const response = await fetch('https://api.os.uk/oauth2/token/v1', {
      method: 'POST',
      body: params,
      headers: {
        Authorization: `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get access token, check the API key and secret');
    }

    return response.json();
  }),

  getRawToken: publicProcedure.query(() => {
    const key = process.env.OS_MAPS_API_KEY ?? '';
    return {
      access_token: key,
      expires_in: '',
      issued_at: '',
      token_type: 'Bearer',
    };
  }),
});
