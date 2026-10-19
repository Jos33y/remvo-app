import { useEffect, useRef, useState } from 'react';
import { spokenDuration } from '@lib/help';
import H from '@styles/pages/marketing/help.module.css';

/* ──────────────────────────────────────────────────────────────────
 * A help page's video, on a strip of film (help1)
 *
 * The frame is the poster: a real screen from the app, 1280x720. With a
 * video, the poster is a play button; YouTube is not contacted until it
 * is pressed, and then only youtube-nocookie.com, which sets no cookies
 * until the video plays. Without a video yet, the poster is a picture
 * of the screen the steps describe.
 *
 * The sprocket holes along the strip are the stamps' perforation in
 * another key: guides are stamps, help is film.
 * ────────────────────────────────────────────────────────────────── */

export function HelpVideo({ entry, priority = false }) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef(null);
  const { title, video, seconds, duration, poster } = entry;

  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);

  const img = (
    <img
      className={H.poster}
      src={poster}
      alt={video ? '' : `The Remvo screen for: ${title}`}
      width="1280"
      height="720"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  );

  return (
    <figure className={H.figure}>
      <div className={H.reel}>
        <div className={H.screen}>
        {!video && img}
        {video && !playing && (
          <button type="button" className={H.play} onClick={() => setPlaying(true)} aria-label={`Play the video: ${title}, ${spokenDuration(seconds)}`}>
            {img}
            <span className={H.playDisc} aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false"><path d="M8 5.5v13l11-6.5z" /></svg>
            </span>
            <span className={H.runtime} aria-hidden="true">{duration}</span>
          </button>
        )}
        {video && playing && (
          <iframe
            ref={frameRef}
            className={H.player}
            src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0&playsinline=1`}
            title={`Video: ${title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>
      </div>
      {video && (
        <figcaption className={H.reelNote}>
          <span>Plays from YouTube when you press play.</span>
          <a href={`https://www.youtube.com/watch?v=${video}`} target="_blank" rel="noopener">
            Watch on YouTube<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </figcaption>
      )}
    </figure>
  );
}
