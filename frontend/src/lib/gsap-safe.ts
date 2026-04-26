/**
 * SSR-safe GSAP loader.
 *
 * GSAP and ScrollTrigger access `document` / `window` during module
 * initialization, which crashes during Next.js server-side rendering or
 * static generation.
 *
 * This module defers the actual import until the browser is available
 * and caches the loaded instances for reuse.
 */

 
let _gsap: any = null;
 
let _ScrollTrigger: any = null;
let _loaded = false;

/**
 * Returns { gsap, ScrollTrigger } — loading both modules lazily and
 * registering the plugin exactly once.  Safe to call from `useEffect`.
 */
export async function getGsap() {
  if (_loaded) return { gsap: _gsap, ScrollTrigger: _ScrollTrigger };

  const [gsapMod, stMod] = await Promise.all([
    import("gsap"),
    import("gsap/ScrollTrigger"),
  ]);

  const gsap = gsapMod.default || gsapMod;
  const ScrollTrigger = stMod.ScrollTrigger || stMod.default;

  if (typeof gsap.registerPlugin === "function") {
    gsap.registerPlugin(ScrollTrigger);
  }

  _gsap = gsap;
  _ScrollTrigger = ScrollTrigger;
  _loaded = true;

  return { gsap, ScrollTrigger };
}

/** Kill every ScrollTrigger whose trigger matches the given element. */
 
export function killTriggersFor(el: Element) {
  if (_ScrollTrigger && typeof _ScrollTrigger.getAll === "function") {
    _ScrollTrigger.getAll().forEach((st: any) => {
      if (st.trigger === el) st.kill();
    });
  }
}
