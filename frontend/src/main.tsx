import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import './styles.css';
import { AuthProvider } from './hooks/useAuth';
import { SocketProvider } from './context/SocketContext';

import { getApiUrl } from './lib/api';

// Global API Fetch Interceptor for Cross-Origin and Custom Base URLs
const originalFetch = window.fetch;
window.fetch = async function (input, init) {
  let url = '';
  const modifiedInit = init ? { ...init } : {};

  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else {
    url = input.url;
  }

  if (url.startsWith('/api')) {
    url = getApiUrl(url);
    modifiedInit.credentials = modifiedInit.credentials || 'include';
  }

  if (typeof input === 'string' || input instanceof URL) {
    return originalFetch(url, modifiedInit);
  } else {
    const newRequest = new Request(url, input);
    return originalFetch(newRequest, modifiedInit);
  }
};

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>
);
