import { http, HttpResponse } from 'msw';

import { apiUrl } from '../api';
import { buildUser } from '../fixtures';

import type { User } from '@/types/auth';

/**
 * The happy path for every `/api/users` endpoint, shaped like `UserController` answers.
 *
 * * Writes echo the submitted name so a spec can tell the stored result apart from the fixture
 * * it started with. A spec that needs a failure overrides one entry with `server.use(...)`.
 */
export function userHandlers(user: User = buildUser()) {
  return [
    http.get(apiUrl('/api/users'), () =>
      HttpResponse.json({ data: [user], total: 1 })
    ),
    http.get(apiUrl('/api/users/:id'), ({ params }) =>
      HttpResponse.json({ data: { ...user, id: Number(params.id) } })
    ),
    http.post(apiUrl('/api/users'), async ({ request }) => {
      const body = (await request.json()) as Partial<User>;

      return HttpResponse.json(
        { data: { ...user, name: body.name ?? user.name } },
        { status: 201 }
      );
    }),
    http.put(apiUrl('/api/users/:id'), async ({ request, params }) => {
      const body = (await request.json()) as Partial<User>;

      return HttpResponse.json({
        data: { ...user, id: Number(params.id), name: body.name ?? user.name }
      });
    }),
    http.delete(
      apiUrl('/api/users/:id'),
      () => new HttpResponse(null, { status: 204 })
    )
  ];
}
