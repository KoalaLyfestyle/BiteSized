// Talks to the Go backend. In development, package.json "proxy" forwards
// /api to http://localhost:8080. Set REACT_APP_API_URL to use another host.
const API_URL = process.env.REACT_APP_API_URL || '/api';

/** A recipe as the API returns it. Ingredients and steps hold one item per line. */
export interface ApiRecipe {
  id: number;
  title: string;
  content: string;
  ingredients: string;
  steps: string;
  user_id: number;
  created_at: string;
}

/** What the create form sends. The server picks the author. */
export interface RecipeInput {
  title: string;
  content: string;
  ingredients: string;
  steps: string;
}

export type FieldErrors = Partial<Record<keyof RecipeInput, string>>;

export class ApiError extends Error {
  status: number;
  fields: FieldErrors;

  constructor(status: number, message: string, fields: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch {
    throw new ApiError(0, 'Could not reach the server. Is the backend running?');
  }
  const text = await res.text();
  let body: any = undefined;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    // Not JSON: fall through with the status text.
  }
  if (!res.ok) {
    throw new ApiError(res.status, body?.error || res.statusText || `Request failed (${res.status})`, body?.fields);
  }
  return body as T;
}

export const listRecipes = () => request<ApiRecipe[]>('/recipes');
export const getRecipe = (id: number) => request<ApiRecipe>(`/recipes/${id}`);
export const createRecipe = (input: RecipeInput) =>
  request<ApiRecipe>('/recipes', { method: 'POST', body: JSON.stringify(input) });
export const getAppConfig = () => request<{ authoring: boolean }>('/config');

/** Field rules shared with the backend (controllers/recipe_controller.go). */
export const LIMITS = { title: 200, content: 2000, ingredients: 5000, steps: 10000 };

export function validateRecipe(input: RecipeInput): FieldErrors {
  const errors: FieldErrors = {};
  const check = (field: keyof RecipeInput, required: boolean) => {
    const value = input[field].trim();
    if (required && !value) errors[field] = 'is required';
    else if (value.length > LIMITS[field]) errors[field] = `must be at most ${LIMITS[field]} characters`;
  };
  check('title', true);
  check('content', false);
  check('ingredients', true);
  check('steps', true);
  return errors;
}

export const splitLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
