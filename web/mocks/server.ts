import { setupServer } from 'msw/node';

// * The one MSW server for the whole suite. Started, reset and closed by `setup.ts`;
// * specs add their own per-test overrides with `server.use(...)`.
export const server = setupServer();
