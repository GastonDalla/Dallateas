export const BUCKET_SIZE = 5;

export type BpmBucket = { bucket: number; count: number };

/** The API only returns bins that hold tracks. A histogram needs the empty ones too, or its axis lies. */
export function fillBpmBuckets(buckets: readonly BpmBucket[]): BpmBucket[] {
  const first = buckets[0]?.bucket;
  const last = buckets.at(-1)?.bucket;
  if (first === undefined || last === undefined) return [];

  const counts = new Map(buckets.map(({ bucket, count }) => [bucket, count]));

  return Array.from({ length: (last - first) / BUCKET_SIZE + 1 }, (_, index) => {
    const bucket = first + index * BUCKET_SIZE;
    return { bucket, count: counts.get(bucket) ?? 0 };
  });
}

export function busiestBucket(buckets: readonly BpmBucket[]) {
  if (buckets.length === 0) return null;
  return buckets.reduce((best, { count }, index) => (count > buckets[best]!.count ? index : best), 0);
}
