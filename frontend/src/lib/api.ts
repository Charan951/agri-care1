export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const getApiUrl = (path: string): string => {
  const cleanBase = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(path);
  const modifiedInit = {
    ...options,
    credentials: options.credentials || 'include' as RequestCredentials,
  };
  return fetch(url, modifiedInit);
}
