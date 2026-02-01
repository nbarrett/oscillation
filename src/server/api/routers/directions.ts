import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

const profileEnum = z.enum([
  'driving-car',
  'driving-hgv',
  'cycling-regular',
  'cycling-road',
  'cycling-mountain',
  'cycling-electric',
  'foot-walking',
  'foot-hiking',
  'wheelchair',
]);

export const directionsRouter = createTRPCRouter({
  getDirections: publicProcedure
    .input(z.object({
      profile: profileEnum,
      start: z.tuple([z.number(), z.number()]),
      end: z.tuple([z.number(), z.number()]),
    }))
    .query(async ({ input }) => {
      const apiKey = process.env.OPENROUTE_API_KEY ?? '5b3ce3597851110001cf6248ce753974beff43f290cdfe4c1a50d56a';
      const { profile, start, end } = input;

      const startInLngLatFormat = `${start[0]},${start[1]}`;
      const endInLngLatFormat = `${end[0]},${end[1]}`;

      const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${startInLngLatFormat}&end=${endInLngLatFormat}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch directions: ${response.statusText}`);
      }

      return response.json();
    }),
});
