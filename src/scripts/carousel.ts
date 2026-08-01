/**
 * Generic slideshow controller for any element marked `data-carousel`.
 * Used by both the Hero image carousel and the Testimonials quote
 * slider (`src/components/home/Hero.astro`, `Testimonials.astro`) —
 * this file has no knowledge of which one it's driving, it just wires
 * up whatever matching data attributes it finds.
 *
 * Expected markup shape (see either consumer for a concrete example):
 *
 *   <div data-carousel data-carousel-autoplay="6000">
 *     <div data-carousel-slide>...</div>
 *     <div data-carousel-slide>...</div>
 *     <div data-carousel-dots></div>            <!-- optional -->
 *     <button data-carousel-prev>...</button>   <!-- optional -->
 *     <button data-carousel-next>...</button>   <!-- optional -->
 *   </div>
 *
 * `data-carousel-autoplay` is the interval in milliseconds between
 * automatic slide advances; omit it (or set 0) for a manually-driven
 * carousel with no autoplay.
 */
function setupCarousels() {
  document.querySelectorAll<HTMLElement>("[data-carousel]").forEach((root) => {
    // Astro's View Transitions router can re-run this on navigation
    // without necessarily destroying/recreating this exact DOM subtree;
    // guard against wiring up the same carousel twice.
    if (root.dataset.carouselReady) return;
    root.dataset.carouselReady = "true";

    const slides = Array.from(root.querySelectorAll<HTMLElement>("[data-carousel-slide]"));
    const dotsWrap = root.querySelector<HTMLElement>("[data-carousel-dots]");
    const prevBtn = root.querySelector<HTMLElement>("[data-carousel-prev]");
    const nextBtn = root.querySelector<HTMLElement>("[data-carousel-next]");
    const autoplay = Number(root.dataset.carouselAutoplay ?? 0);
    if (!slides.length) return;

    let index = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    // Build one dot button per slide, if a dots container was provided.
    // Kept as a parallel array (dots[i] corresponds to slides[i]) so
    // render() can toggle both in lockstep.
    const dots = slides.map((_, i) => {
      if (!dotsWrap) return null;
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.className = "h-1.5 rounded-full bg-current opacity-30 transition-all duration-300";
      dot.addEventListener("click", () => go(i, true));
      dotsWrap.appendChild(dot);
      return dot;
    });

    /**
     * Promotes a lazily-deferred slide image from `data-src` to `src`,
     * causing the browser to start fetching it. Used so that non-active
     * hero slides don't download their (large) images until they're
     * actually about to be shown — see the `preloadImage` calls in
     * render() below for exactly when that happens. Testimonial slides
     * have no images, so this is a harmless no-op for that carousel.
     */
    function preloadImage(slide: HTMLElement | undefined) {
      const img = slide?.querySelector<HTMLImageElement>("img[data-src]");
      if (!img) return;
      img.src = img.dataset.src!;
      delete img.dataset.src;
    }

    /** Applies the current `index` to the DOM: shows the active slide, updates dots, and preloads upcoming media. */
    function render() {
      slides.forEach((slide, i) => {
        slide.classList.toggle("opacity-100", i === index);
        slide.classList.toggle("opacity-0", i !== index);
        slide.classList.toggle("pointer-events-none", i !== index);
        slide.setAttribute("aria-hidden", String(i !== index));
      });
      // Defer non-active slide media until it's about to be shown, so a
      // visitor who never reaches slide N+1 never pays for its download.
      // Preloading one slide ahead (not just the active one) means the
      // image has the full autoplay interval to finish downloading
      // before it needs to be shown.
      preloadImage(slides[index]);
      preloadImage(slides[(index + 1) % slides.length]);
      dots.forEach((dot, i) => {
        dot?.classList.toggle("opacity-100", i === index);
        dot?.classList.toggle("w-6", i === index);
        dot?.classList.toggle("w-1.5", i !== index);
        dot?.classList.toggle("opacity-30", i !== index);
      });
    }

    /**
     * Navigates to slide `next`, wrapping around in either direction
     * (so `go(index - 1)` from slide 0 lands on the last slide, and
     * vice versa). `manual` should be true for user-initiated navigation
     * (dot/arrow clicks), which resets the autoplay countdown so it
     * doesn't advance again immediately after; autoplay's own interval
     * tick calls `go` with `manual` left false.
     */
    function go(next: number, manual = false) {
      index = (next + slides.length) % slides.length;
      render();
      if (manual) resetTimer();
    }

    function resetTimer() {
      if (!autoplay) return;
      if (timer) clearInterval(timer);
      timer = setInterval(() => go(index + 1), autoplay);
    }

    prevBtn?.addEventListener("click", () => go(index - 1, true));
    nextBtn?.addEventListener("click", () => go(index + 1, true));

    render();
    resetTimer();
  });
}

document.addEventListener("astro:page-load", setupCarousels);
