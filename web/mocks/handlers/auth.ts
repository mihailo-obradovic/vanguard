import { http, HttpResponse } from 'msw';

import { apiUrl } from '../api';
import { buildUser } from '../fixtures';

import type { User } from '@/types/auth';

/**
 * The happy path for the session and password endpoints.
 *
 * * The session routes answer 204 and live outside `/api`, exactly as the web routes do —
 * * the stateful Sanctum posture depends on that split.
 */
export function authHandlers(user: User = buildUser()) {
  const noContent = () => new HttpResponse(null, { status: 204 });

  return [
    http.post(apiUrl('/register'), noContent),
    http.post(apiUrl('/login'), noContent),
    http.post(apiUrl('/logout'), noContent),
    http.get(apiUrl('/api/user'), () => HttpResponse.json({ data: user })),
    http.put(apiUrl('/api/profile'), async ({ request }) => {
      const body = (await request.json()) as Partial<User>;

      return HttpResponse.json({
        data: { ...user, name: body.name ?? user.name }
      });
    }),
    http.post(apiUrl('/email/verification-notification'), () =>
      HttpResponse.json({ status: 'verification-link-sent' })
    ),
    http.post(apiUrl('/forgot-password'), () =>
      HttpResponse.json({ status: 'We have emailed your password reset link.' })
    ),
    http.post(apiUrl('/reset-password'), () =>
      HttpResponse.json({ status: 'Your password has been reset.' })
    )
  ];
}
