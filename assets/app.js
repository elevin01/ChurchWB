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
  let wheelAccum = 0;
  let wheelTimer;

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
      if (event.deltaY <= 0) {
        return;
      }
      event.preventDefault();
      wheelAccum += event.deltaY;
      if (wheelAccum > 40) {
        wheelAccum = 0;
        goToAbout();
      }
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(() => {
        wheelAccum = 0;
      }, 200);
    },
    { passive: false }
  );

  window.addEventListener('keydown', (event) => {
    if (!canNavigate()) {
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      goToAbout();
    }
  });

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
  const fallbackSrc = rotatingBg.dataset.fallback;
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

    let currentSrc = fallbackSrc || '';
    let activeLayer = currentLayer;
    let idleLayer = nextLayer;
    const loadedImages = new Set();

    const setBackground = (layer, src) => {
      layer.style.backgroundImage = `url('${src}')`;
    };

    const preloadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          loadedImages.add(src);
          resolve(true);
        };
        img.onerror = () => resolve(false);
        img.src = src;
      });

    if (currentSrc) {
      setBackground(activeLayer, currentSrc);
      activeLayer.classList.add('is-visible');
    }

    const startIndex = Math.floor(Math.random() * images.length);
    const firstSrc = images[startIndex];
    const firstLoaded = await preloadImage(firstSrc);

    if (firstLoaded) {
      setBackground(activeLayer, firstSrc);
      activeLayer.classList.add('is-visible');
      currentSrc = firstSrc;
    }

    const preloadImages = () => {
      images.forEach((src, index) => {
        if (index === startIndex) {
          return;
        }
        preloadImage(src);
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadImages, { timeout: 2000 });
    } else {
      setTimeout(preloadImages, 1500);
    }

    const getLoadedList = () => images.filter((src) => loadedImages.has(src));

    if (!prefersReducedMotion && images.length > 1) {
      setInterval(() => {
        const available = getLoadedList();
        if (available.length < 2) {
          return;
        }
        const currentPos = Math.max(0, available.indexOf(currentSrc));
        const nextSrc = available[(currentPos + 1) % available.length];
        setBackground(idleLayer, nextSrc);
        idleLayer.classList.add('is-visible');
        activeLayer.classList.remove('is-visible');

        const previousLayer = activeLayer;
        activeLayer = idleLayer;
        idleLayer = previousLayer;
        currentSrc = nextSrc;
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

const siteFooter = document.querySelector('.site-footer');

if (siteFooter) {
  const footerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && window.scrollY > 120) {
          document.body.classList.add('footer-focus');
        } else {
          document.body.classList.remove('footer-focus');
        }
      });
    },
    {
      threshold: 0.6,
    }
  );

  footerObserver.observe(siteFooter);
}

const footerVerse = document.querySelector('[data-verse]');

if (footerVerse) {
  const verses = [
    {
      ref: '1 Peter 4:10',
      text:
        'Each of you should use whatever gift you have received to serve others, as faithful stewards of God’s grace in its various forms.',
    },
    {
      ref: 'Matthew 25:40',
      text:
        'The King will reply, “Truly I tell you, whatever you did for one of the least of these brothers and sisters of mine, you did for me.”',
    },
    {
      ref: 'Galatians 5:13',
      text:
        'You, my brothers and sisters, were called to be free. But do not use your freedom to indulge the flesh; rather, serve one another humbly in love.',
    },
    {
      ref: 'Colossians 3:23',
      text:
        'Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.',
    },
  ];

  const verseText = footerVerse.querySelector('p');
  const verseRef = footerVerse.querySelector('cite');

  const setFooterVerse = () => {
    const choice = verses[Math.floor(Math.random() * verses.length)];
    if (verseText) {
      verseText.textContent = choice.text;
    }
    if (verseRef) {
      verseRef.textContent = choice.ref;
    }
  };

  setFooterVerse();

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      setFooterVerse();
    }
  });
}
