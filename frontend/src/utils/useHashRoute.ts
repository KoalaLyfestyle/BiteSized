import { useEffect, useState } from 'react';

export type Route =
  | { page: 'recipes' }
  | { page: 'new-recipe' }
  | { page: 'recipe'; id: number }
  | { page: 'not-found' };

/** Hash routes survive a refresh without server rewrites: #/recipes, #/recipes/new, #/recipes/3. */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/\/+$/, '') || '/recipes';
  if (path === '/' || path === '/recipes') return { page: 'recipes' };
  if (path === '/recipes/new') return { page: 'new-recipe' };
  const match = /^\/recipes\/(\d+)$/.exec(path);
  if (match) return { page: 'recipe', id: Number(match[1]) };
  return { page: 'not-found' };
}

export function navigate(path: string) {
  window.location.hash = path;
}

export function useHashRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
