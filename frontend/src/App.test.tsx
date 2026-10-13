import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { parseHash } from './utils/useHashRoute';

type Handler = (url: string, init?: RequestInit) => { status: number; body?: unknown } | Promise<never>;

function mockFetch(handler: Handler) {
  const fn = jest.fn(async (url: string, init?: RequestInit) => {
    const res = await handler(url, init);
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      statusText: '',
      text: async () => (res.body === undefined ? '' : JSON.stringify(res.body)),
    } as Response;
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

const sample = {
  id: 1,
  title: '[Sample] Overnight oats',
  content: 'No-cook breakfast',
  ingredients: 'oats\nmilk',
  steps: 'Mix\nChill overnight',
  user_id: 1,
  created_at: '2026-10-13T00:00:00Z',
};

function goTo(hash: string) {
  window.location.hash = hash;
}

beforeEach(() => goTo('#/recipes'));

test('parses hash routes', () => {
  expect(parseHash('')).toEqual({ page: 'recipes' });
  expect(parseHash('#/recipes/new')).toEqual({ page: 'new-recipe' });
  expect(parseHash('#/recipes/12')).toEqual({ page: 'recipe', id: 12 });
  expect(parseHash('#/nope')).toEqual({ page: 'not-found' });
});

test('recipe list shows loading, then recipes from the API', async () => {
  const fetch = mockFetch(() => ({ status: 200, body: [sample] }));
  render(<App />);
  expect(screen.getByLabelText('Loading recipes')).toBeInTheDocument();
  expect(await screen.findByText('[Sample] Overnight oats')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('/api/recipes', expect.anything());
});

test('recipe list shows an empty state', async () => {
  mockFetch(() => ({ status: 200, body: [] }));
  render(<App />);
  expect(await screen.findByText('No recipes yet')).toBeInTheDocument();
});

test('recipe list shows an error and retries', async () => {
  let fail = true;
  mockFetch(() => (fail ? { status: 500, body: { error: 'Failed to fetch recipes' } } : { status: 200, body: [sample] }));
  render(<App />);
  expect(await screen.findByText(/Could not load recipes: Failed to fetch recipes/)).toBeInTheDocument();
  fail = false;
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
  expect(await screen.findByText('[Sample] Overnight oats')).toBeInTheDocument();
});

test('recipe list explains when the server is down', async () => {
  mockFetch(() => Promise.reject(new TypeError('Failed to fetch')));
  render(<App />);
  expect(await screen.findByText(/Is the backend running/)).toBeInTheDocument();
});

test('detail page lists ingredients and steps', async () => {
  goTo('#/recipes/1');
  const fetch = mockFetch(() => ({ status: 200, body: sample }));
  render(<App />);
  expect(await screen.findByRole('heading', { name: '[Sample] Overnight oats' })).toBeInTheDocument();
  expect(screen.getByText('milk')).toBeInTheDocument();
  expect(screen.getByText('Chill overnight')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith('/api/recipes/1', expect.anything());
});

test('detail page handles a missing recipe', async () => {
  goTo('#/recipes/99');
  mockFetch(() => ({ status: 404, body: { error: 'recipe not found' } }));
  render(<App />);
  expect(await screen.findByText('This recipe does not exist.')).toBeInTheDocument();
});

describe('create form', () => {
  beforeEach(() => goTo('#/recipes/new'));

  test('says the demo is read-only when authoring is off', async () => {
    mockFetch(() => ({ status: 200, body: { authoring: false } }));
    render(<App />);
    expect(await screen.findByText(/This demo is read-only/)).toBeInTheDocument();
  });

  test('blocks an empty submission without calling the API', async () => {
    const fetch = mockFetch(() => ({ status: 200, body: { authoring: true } }));
    render(<App />);
    const post = await screen.findByRole('button', { name: 'Post Recipe' });
    await waitFor(() => expect(post).toBeEnabled());
    fireEvent.click(post);
    expect(await screen.findByText('Fix the highlighted fields before posting.')).toBeInTheDocument();
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Ingredients is required')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1); // only /api/config
  });

  test('sends one line per item and opens the new recipe', async () => {
    const fetch = mockFetch((url, init) => {
      if (url === '/api/config') return { status: 200, body: { authoring: true } };
      if (init?.method === 'POST') return { status: 201, body: { ...sample, id: 5 } };
      return { status: 200, body: { ...sample, id: 5 } };
    });
    render(<App />);
    const post = await screen.findByRole('button', { name: 'Post Recipe' });
    await waitFor(() => expect(post).toBeEnabled());

    fireEvent.change(screen.getByLabelText(/Recipe Title/), { target: { value: 'Toast' } });
    const ingredient = screen.getByLabelText('Ingredient');
    for (const item of ['bread', 'butter']) {
      fireEvent.change(ingredient, { target: { value: item } });
      fireEvent.click(screen.getByRole('button', { name: 'Add Ingredient' }));
    }
    fireEvent.change(screen.getByLabelText('Steps'), { target: { value: 'Toast it' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Step' }));
    await act(async () => {
      fireEvent.click(post);
    });

    const call = fetch.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(String(call[1]!.body))).toEqual({
      title: 'Toast',
      content: '',
      ingredients: 'bread\nbutter',
      steps: 'Toast it',
    });
    await waitFor(() => expect(window.location.hash).toBe('#/recipes/5'));
  });

  test('shows the server error for a rejected recipe', async () => {
    mockFetch((url, init) => {
      if (url === '/api/config') return { status: 200, body: { authoring: true } };
      return { status: 400, body: { error: 'invalid recipe', fields: { title: 'must be at most 200 characters' } } };
    });
    render(<App />);
    const post = await screen.findByRole('button', { name: 'Post Recipe' });
    await waitFor(() => expect(post).toBeEnabled());
    fireEvent.change(screen.getByLabelText(/Recipe Title/), { target: { value: 'Fine title' } });
    fireEvent.change(screen.getByLabelText('Ingredient'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Ingredient' }));
    fireEvent.change(screen.getByLabelText('Steps'), { target: { value: 'y' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Step' }));
    fireEvent.click(post);
    expect(await screen.findByText('invalid recipe')).toBeInTheDocument();
    expect(screen.getByText('Title must be at most 200 characters')).toBeInTheDocument();
  });
});
