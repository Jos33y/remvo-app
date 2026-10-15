import { useEffect } from 'react';

/* useThemeColor
 *
 * The browser's own bar (address bar, status bar) takes its colour from
 * <meta name="theme-color">. index.html sets obsidian, right for the
 * site and sign-in. Screens that follow the phone's light or dark mode
 * pass one colour for each, and the browser picks by the mode. The
 * page's own tag comes back when the screen goes.
 */
export function useThemeColor(light, dark) {
  useEffect(() => {
    const own = [...document.head.querySelectorAll('meta[name="theme-color"]')];
    own.forEach((m) => m.remove());
    const added = [
      ['(prefers-color-scheme: light)', light],
      ['(prefers-color-scheme: dark)', dark],
    ].map(([media, content]) => {
      const m = document.createElement('meta');
      m.name = 'theme-color';
      m.media = media;
      m.content = content;
      document.head.appendChild(m);
      return m;
    });
    return () => {
      added.forEach((m) => m.remove());
      own.forEach((m) => document.head.appendChild(m));
    };
  }, [light, dark]);
}
