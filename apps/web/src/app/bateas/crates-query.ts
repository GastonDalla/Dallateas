export type CrateType = "GENRE" | "SET" | "OTHER";

type CrateFilters = {
  search?: string;
  type?: CrateType;
  genre?: string;
};

const CRATES_PER_PAGE = 50;

/** One input for the server prefetch and the client filters, so the two always share a cache entry. */
export function cratesInput({ search, type, genre }: CrateFilters) {
  return {
    limit: CRATES_PER_PAGE,
    ...(search && { search }),
    ...(type && { type }),
    ...(genre && { genre }),
  };
}
