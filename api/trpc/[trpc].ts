import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../../server/routers';
import { createVercelContext } from '../../server/_core/vercel-context';

export const config = {
  runtime: 'nodejs20.x',
  maxDuration: 30,
};

export default async function handler(request: Request): Promise<Response> {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: ({ req }) => createVercelContext(req),
    onError: ({ error, path }) => {
      console.error(`[tRPC] Error in ${path}:`, error.message);
    },
  });
}
