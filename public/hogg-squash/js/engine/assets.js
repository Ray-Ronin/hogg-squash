// @ts-check
// Image and JSON loader with a simple loading state: start every load at once, count them as they finish, and give
// back one promise for the lot. A failed load rejects the promise (the caller decides what to do without it).

/**
 * @typedef {{ kind: 'image' | 'json', url: string }} AssetSpec
 * @typedef {{ done: number, total: number, error: string | null }} LoadState
 */

/**
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/**
 * @param {string} url
 * @returns {Promise<any>}
 */
export async function loadJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not load ${url} (${res.status})`);
  return res.json();
}

/**
 * Load a named set of assets.
 * @template {Record<string, AssetSpec>} T
 * @param {T} specs
 * @returns {{ state: LoadState, ready: Promise<{ [K in keyof T]: T[K]['kind'] extends 'image' ? HTMLImageElement : any }> }}
 *   state counts the loads as they finish (for a loading screen); ready resolves with every asset by name
 */
export function loadAssets(specs) {
  const names = Object.keys(specs);
  /** @type {LoadState} */
  const state = { done: 0, total: names.length, error: null };
  const ready = Promise.all(names.map(async name => {
    const { kind, url } = specs[name];
    try {
      const asset = kind === 'image' ? await loadImage(url) : await loadJson(url);
      state.done++;
      return [name, asset];
    } catch (e) {
      state.error = e instanceof Error ? e.message : String(e);
      throw e;
    }
  })).then(pairs => /** @type {any} */ (Object.fromEntries(pairs)));
  return { state, ready };
}
