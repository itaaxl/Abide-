import "server-only";
import { getProvider } from "./provider";
import { buildIndex, searchIndex, type SearchIndex, type SearchOptions, type SearchResult } from "./search-index";

const indexes = new Map<string, Promise<SearchIndex>>();

async function getIndex(editionId: string): Promise<SearchIndex | null> {
  const provider = await getProvider(editionId);
  if (!provider) return null;
  let idx = indexes.get(editionId);
  if (!idx) {
    idx = provider.getCorpus().then(buildIndex);
    indexes.set(editionId, idx);
  }
  return idx;
}

export async function searchBible(
  editionId: string,
  query: string,
  opts: SearchOptions = {},
): Promise<SearchResult | null> {
  const provider = await getProvider(editionId);
  const index = await getIndex(editionId);
  if (!provider || !index) return null;
  return searchIndex(index, await provider.getEdition(), query, opts);
}
