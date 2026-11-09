export function VideoFrame({ videoId, title }: { videoId: string; title: string }) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
      title={title}
      className="aspect-video w-full max-w-2xl"
      loading="lazy"
      allow="autoplay; encrypted-media"
      allowFullScreen
    />
  );
}
