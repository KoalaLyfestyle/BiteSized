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
  tags: ['Breakfast'],
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

test('switching recipes ignores a late reply for the old one', async () => {
  goTo('#/recipes/1');
  let releaseFirst: () => void = () => {};
  mockFetch((url) => {
    if (url === '/api/recipes/1') {
      return new Promise((resolve) => {
        releaseFirst = () => resolve({ status: 200, body: sample });
      }) as never;
    }
    return { status: 200, body: { ...sample, id: 2, title: 'Second' } };
  });
  render(<App />);
  act(() => goTo('#/recipes/2'));
  expect(await screen.findByRole('heading', { name: 'Second' })).toBeInTheDocument();
  await act(async () => releaseFirst());
  expect(screen.getByRole('heading', { name: 'Second' })).toBeInTheDocument();
});

test('recipe list filters by tag', async () => {
  const dinner = { ...sample, id: 2, title: 'Fried rice', tags: ['Dinner', 'Quick'] };
  const plain = { ...sample, id: 3, title: 'Plain rice', tags: [] };
  mockFetch(() => ({ status: 200, body: [sample, dinner, plain] }));
  render(<App />);
  expect(await screen.findByText('Fried rice')).toBeInTheDocument();
  expect(screen.getByText('Quick')).toBeInTheDocument(); // tag chip on the card

  const filter = screen.getByLabelText('Filter by tags');
  fireEvent.mouseDown(filter);
  // Options are the tags of the loaded recipes, sorted.
  expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Breakfast', 'Dinner', 'Quick']);
  fireEvent.click(screen.getByRole('option', { name: 'Dinner' }));

  expect(screen.getByText('Fried rice')).toBeInTheDocument();
  expect(screen.queryByText('[Sample] Overnight oats')).not.toBeInTheDocument();
  expect(screen.queryByText('Plain rice')).not.toBeInTheDocument();
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
      tags: [],
    });
    await waitFor(() => expect(window.location.hash).toBe('#/recipes/5'));
  });

  test('sends tags without blanks or duplicates, including one still being typed', async () => {
    const fetch = mockFetch((url, init) => {
      if (url === '/api/config') return { status: 200, body: { authoring: true } };
      return { status: 201, body: { ...sample, id: 7 } };
    });
    render(<App />);
    const post = await screen.findByRole('button', { name: 'Post Recipe' });
    await waitFor(() => expect(post).toBeEnabled());
    fireEvent.change(screen.getByLabelText(/Recipe Title/), { target: { value: 'Toast' } });
    fireEvent.change(screen.getByLabelText('Ingredient'), { target: { value: 'bread' } });
    fireEvent.change(screen.getByLabelText('Steps'), { target: { value: 'Toast it' } });

    const tags = screen.getByLabelText('Tags');
    for (const tag of ['Quick', ' quick ']) {
      fireEvent.change(tags, { target: { value: tag } });
      fireEvent.keyDown(tags, { key: 'Enter' });
    }
    fireEvent.change(tags, { target: { value: 'Kaya' } });
    fireEvent.blur(tags); // typed but not entered: kept on leaving the field
    await act(async () => {
      fireEvent.click(post);
    });
    const call = fetch.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(String(call[1]!.body)).tags).toEqual(['Quick', 'Kaya']);
  });

  test('blocks more than 10 tags without calling the API', async () => {
    const fetch = mockFetch(() => ({ status: 200, body: { authoring: true } }));
    render(<App />);
    const post = await screen.findByRole('button', { name: 'Post Recipe' });
    await waitFor(() => expect(post).toBeEnabled());
    fireEvent.change(screen.getByLabelText(/Recipe Title/), { target: { value: 'Toast' } });
    fireEvent.change(screen.getByLabelText('Ingredient'), { target: { value: 'bread' } });
    fireEvent.change(screen.getByLabelText('Steps'), { target: { value: 'Toast it' } });
    const tags = screen.getByLabelText('Tags');
    for (let i = 1; i <= 11; i++) {
      fireEvent.change(tags, { target: { value: `tag${i}` } });
      fireEvent.keyDown(tags, { key: 'Enter' });
    }
    fireEvent.click(post);
    expect(await screen.findByText('Tags must be at most 10')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1); // only /api/config
  });

  test('keeps an ingredient and step that were typed but not added', async () => {
    const fetch = mockFetch((url, init) => {
      if (url === '/api/config') return { status: 200, body: { authoring: true } };
      return { status: 201, body: { ...sample, id: 6 } };
    });
    render(<App />);
    const post = await screen.findByRole('button', { name: 'Post Recipe' });
    await waitFor(() => expect(post).toBeEnabled());
    fireEvent.change(screen.getByLabelText(/Recipe Title/), { target: { value: 'Tea' } });
    fireEvent.change(screen.getByLabelText('Ingredient'), { target: { value: 'tea leaves' } });
    fireEvent.change(screen.getByLabelText('Steps'), { target: { value: 'Steep' } });
    await act(async () => {
      fireEvent.click(post);
    });
    const call = fetch.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(JSON.parse(String(call[1]!.body))).toMatchObject({ ingredients: 'tea leaves', steps: 'Steep' });
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
