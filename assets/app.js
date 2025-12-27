const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  siteNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const isHomeScreen = document.body.classList.contains('home-screen');

if (isHomeScreen) {
  let isNavigating = false;
  let touchStartY = 0;

  const canNavigate = () => !isNavigating && !(siteNav && siteNav.classList.contains('open'));

  const goToAbout = () => {
    if (!canNavigate()) {
      return;
    }
    isNavigating = true;
    window.location.href = 'about.html';
  };

  window.addEventListener(
    'wheel',
    (event) => {
      if (event.deltaY > 25) {
        event.preventDefault();
        goToAbout();
      }
    },
    { passive: false }
  );

  window.addEventListener(
    'touchstart',
    (event) => {
      if (event.touches && event.touches.length) {
        touchStartY = event.touches[0].clientY;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    (event) => {
      if (!touchStartY) {
        return;
      }
      const endY = event.changedTouches ? event.changedTouches[0].clientY : touchStartY;
      if (touchStartY - endY > 50) {
        goToAbout();
      }
      touchStartY = 0;
    },
    { passive: true }
  );
}

const rotatingBg = document.querySelector('[data-rotating-bg]');

if (rotatingBg) {
  const inlineImages = (rotatingBg.dataset.images || '')
    .split(',')
    .map((src) => src.trim())
    .filter(Boolean);
  const manifestUrl = rotatingBg.dataset.manifest;
  const currentLayer = rotatingBg.querySelector('.bg-layer--current');
  const nextLayer = rotatingBg.querySelector('.bg-layer--next');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 720px)').matches;
  const interval = isMobile ? 12000 : 10000;

  const loadManifest = async () => {
    if (!manifestUrl) {
      return null;
    }
    try {
      const response = await fetch(manifestUrl, { cache: 'no-store' });
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      }
      if (data && Array.isArray(data.images)) {
        return data.images;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  const initRotatingBg = async () => {
    const manifestImages = await loadManifest();
    const images = (manifestImages && manifestImages.length ? manifestImages : inlineImages).filter(
      Boolean
    );

    if (!images.length || !currentLayer || !nextLayer) {
      return;
    }

    const startIndex = Math.floor(Math.random() * images.length);
    let currentIndex = startIndex;
    let activeLayer = currentLayer;
    let idleLayer = nextLayer;

    const setBackground = (layer, src) => {
      layer.style.backgroundImage = `url('${src}')`;
    };

    setBackground(activeLayer, images[startIndex]);
    activeLayer.classList.add('is-visible');

    const preloadImages = () => {
      images.forEach((src, index) => {
        if (index === startIndex) {
          return;
        }
        const img = new Image();
        img.src = src;
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadImages, { timeout: 2000 });
    } else {
      setTimeout(preloadImages, 1500);
    }

    if (!prefersReducedMotion && images.length > 1) {
      setInterval(() => {
        const nextIndex = (currentIndex + 1) % images.length;
        setBackground(idleLayer, images[nextIndex]);
        idleLayer.classList.add('is-visible');
        activeLayer.classList.remove('is-visible');

        const previousLayer = activeLayer;
        activeLayer = idleLayer;
        idleLayer = previousLayer;
        currentIndex = nextIndex;
      }, interval);
    }
  };

  initRotatingBg();
}

const revealItems = document.querySelectorAll('[data-reveal]');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduceMotion) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else if (revealItems.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
}
