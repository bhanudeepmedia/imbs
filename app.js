/* ==========================================================================
   IMBS WEBSITE - INTERACTIVE LOGIC (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // Wrap animations in a reduced-motion media query check
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenis;

  // ==========================================================================
  // 1. Mobile Navigation Hamburger Overlay (Runs regardless of motion preferences)
  // ==========================================================================
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu-overlay');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isActive = mobileMenu.classList.contains('active');
      if (isActive) {
        mobileMenu.classList.remove('active');
        hamburger.classList.remove('active');
        gsap.to('#hamburger span:nth-child(1)', { rotation: 0, y: 0, duration: 0.2 });
        gsap.to('#hamburger span:nth-child(2)', { opacity: 1, duration: 0.2 });
        gsap.to('#hamburger span:nth-child(3)', { rotation: 0, y: 0, duration: 0.2 });
      } else {
        mobileMenu.classList.add('active');
        hamburger.classList.add('active');
        gsap.to('#hamburger span:nth-child(1)', { rotation: 45, y: 6, duration: 0.2 });
        gsap.to('#hamburger span:nth-child(2)', { opacity: 0, duration: 0.2 });
        gsap.to('#hamburger span:nth-child(3)', { rotation: -45, y: -6, duration: 0.2 });
      }
    });

    const mobileLinks = document.querySelectorAll('.mobile-menu-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        hamburger.classList.remove('active');
        gsap.to('#hamburger span:nth-child(1)', { rotation: 0, y: 0, duration: 0.2 });
        gsap.to('#hamburger span:nth-child(2)', { opacity: 1, duration: 0.2 });
        gsap.to('#hamburger span:nth-child(3)', { rotation: 0, y: 0, duration: 0.2 });
      });
    });
  }

  // ==========================================================================
  // 2. Interactive Brochure Modal & Floating Labels
  // ==========================================================================
  const brochureModal = document.getElementById('brochure-modal');
  const openModalBtns = document.querySelectorAll('.trigger-brochure-modal');
  const closeModalBtn = document.getElementById('close-brochure-modal');
  const brochureForm = document.getElementById('brochure-form');

  function openModal() {
    brochureModal.classList.add('active');
    if (lenis) lenis.stop();
  }

  function closeModal() {
    brochureModal.classList.remove('active');
    if (lenis) lenis.start();
  }

  openModalBtns.forEach(btn => btn.addEventListener('click', openModal));
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  if (brochureModal) {
    brochureModal.addEventListener('click', (e) => {
      if (e.target === brochureModal) {
        closeModal();
      }
    });
  }

  if (brochureForm) {
    brochureForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('brochure-name').value.trim();
      const email = document.getElementById('brochure-email').value.trim();
      const phone = document.getElementById('brochure-phone').value.trim();

      if (name && email && phone) {
        const cardContent = brochureModal.querySelector('.modal-card');
        const originalContent = cardContent.innerHTML;

        cardContent.innerHTML = `
          <h3 class="modal-title">Thank You!</h3>
          <p class="modal-desc" style="margin-top: 15px; font-size: 16px; color: var(--white);">
            Your request has been successfully received. We have sent the brochure and details to <strong>${email}</strong>.
          </p>
          <button class="btn btn-primary-red" id="success-close-btn" style="margin-top: 20px;">Close Window</button>
        `;

        document.getElementById('success-close-btn').addEventListener('click', () => {
          closeModal();
          setTimeout(() => {
            cardContent.innerHTML = originalContent;
            document.getElementById('close-brochure-modal').addEventListener('click', closeModal);
            setupFloatLabels();
          }, 300);
        });
      }
    });
  }

  function setupFloatLabels() {
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
      if (input.value.trim() !== "") {
        input.placeholder = " ";
      }
    });
  }
  setupFloatLabels();

  // ==========================================================================
  // 3. Testimonials Carousel Horizontal Slider
  // ==========================================================================
  let currentIndex = 0;
  const track = document.getElementById('testimonials-track');
  const testimonialCards = document.querySelectorAll('.testimonial-card');
  const totalCards = testimonialCards.length;
  const prevBtn = document.getElementById('prev-testimonial');
  const nextBtn = document.getElementById('next-testimonial');

  function getCardsPerView() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1280) return 2;
    return 3;
  }

  function slideTestimonials() {
    if (!track || testimonialCards.length === 0) return;
    const cardsPerView = getCardsPerView();
    const maxIndex = totalCards - cardsPerView;
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    if (currentIndex < 0) currentIndex = 0;

    const cardWidth = testimonialCards[0].offsetWidth;
    const gap = 32;
    const moveX = -currentIndex * (cardWidth + gap);

    if (!prefersReducedMotion) {
      gsap.to(track, {
        x: moveX,
        duration: 0.6,
        ease: 'power2.out'
      });
    } else {
      track.style.transform = `translateX(${moveX}px)`;
    }
  }

  if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', () => {
      const cardsPerView = getCardsPerView();
      if (currentIndex < totalCards - cardsPerView) {
        currentIndex++;
      } else {
        currentIndex = 0;
      }
      slideTestimonials();
      resetAutoAdvance();
    });

    prevBtn.addEventListener('click', () => {
      const cardsPerView = getCardsPerView();
      if (currentIndex > 0) {
        currentIndex--;
      } else {
        currentIndex = totalCards - cardsPerView;
      }
      slideTestimonials();
      resetAutoAdvance();
    });

    window.addEventListener('resize', slideTestimonials);

    let autoAdvanceCall;
    if (!prefersReducedMotion) {
      autoAdvanceCall = gsap.delayedCall(5, autoAdvance);
    }

    function autoAdvance() {
      const cardsPerView = getCardsPerView();
      if (currentIndex < totalCards - cardsPerView) {
        currentIndex++;
      } else {
        currentIndex = 0;
      }
      slideTestimonials();
      autoAdvanceCall.restart(true);
    }

    function resetAutoAdvance() {
      if (autoAdvanceCall) {
        autoAdvanceCall.restart(true);
      }
    }
  }

  // ==========================================================================
  // 4. Back to Top Button Actions
  // ==========================================================================
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.5 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // ==========================================================================
  // 5. Card Scrolling Anchors (Mega Menu & Footer)
  // ==========================================================================
  const categoryMap = {
    'doctorate': 0,
    'post-graduate': 1,
    'graduate': 2,
    'diploma': 3,
    'adv-diploma': 4,
    'pg-diploma': 5,
    'mdp': 6,
    'certificate': 7
  };

  function scrollToCard(index) {
    if (window.innerWidth < 992 || prefersReducedMotion) {
      const card = document.querySelector(`.program-stack-card[data-index="${index}"]`);
      if (card) {
        if (lenis) {
          lenis.scrollTo(card, { offset: -90, duration: 1.2 });
        } else {
          card.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      const trigger = ScrollTrigger.getById("main-stack-trigger");
      if (trigger && typeof trigger.labelToScroll === 'function') {
        const scrollPos = trigger.labelToScroll(`card-${index}`);
        if (lenis) {
          lenis.scrollTo(scrollPos, { duration: 1.5 });
        } else {
          window.scrollTo({ top: scrollPos, behavior: 'smooth' });
        }
      } else {
        // Fallback manual scroll calculation
        const container = document.querySelector('.programs-stack-container');
        if (!container) return;
        const startOffset = container.offsetTop;
        const totalScroll = container.offsetHeight - window.innerHeight;
        const targetScroll = startOffset + (index * (totalScroll / 8)) + 50;
        if (lenis) {
          lenis.scrollTo(targetScroll, { duration: 1.5 });
        } else {
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      }
    }
  }

  // Hook Mega Menu dropdown click handlers
  const megaMenuItems = document.querySelectorAll('.mega-menu-item');
  megaMenuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const category = item.getAttribute('data-tab');
      const index = categoryMap[category];
      if (index !== undefined) {
        e.preventDefault();
        scrollToCard(index);
      }
    });
  });

  // Hook Footer link click handlers
  const footerLinks = document.querySelectorAll('[data-footer-tab]');
  footerLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const category = link.getAttribute('data-footer-tab');
      const index = categoryMap[category];
      if (index !== undefined) {
        e.preventDefault();
        scrollToCard(index);
      }
    });
  });

  // ==========================================================================
  // 6. Accordion Interactive Enhancements (Mutual Exclusivity)
  // ==========================================================================
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    if (header) {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = item.classList.contains('active');
        
        // Close all other active items
        accordionItems.forEach(otherItem => {
          if (otherItem !== item && otherItem.classList.contains('active')) {
            otherItem.classList.remove('active');
            const otherBorder = otherItem.querySelector('.accordion-border');
            const otherContent = otherItem.querySelector('.accordion-content');
            const otherIcon = otherItem.querySelector('.accordion-icon');
            
            if (!prefersReducedMotion) {
              gsap.to(otherBorder, { scaleY: 0, duration: 0.3, ease: 'power2.out', transformOrigin: 'top' });
              gsap.to(otherContent, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.out' });
              gsap.to(otherIcon, { rotation: 0, duration: 0.3 });
            } else {
              if (otherContent) otherContent.style.maxHeight = '0';
            }
            otherItem.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
          }
        });
        
        const border = item.querySelector('.accordion-border');
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon');
        
        if (isActive) {
          item.classList.remove('active');
          if (!prefersReducedMotion) {
            gsap.to(border, { scaleY: 0, duration: 0.3, ease: 'power2.out', transformOrigin: 'top' });
            gsap.to(content, { height: 0, opacity: 0, duration: 0.4, ease: 'power2.out' });
            gsap.to(icon, { rotation: 0, duration: 0.3 });
          } else {
            if (content) content.style.maxHeight = '0';
          }
          header.setAttribute('aria-expanded', 'false');
        } else {
          item.classList.add('active');
          if (!prefersReducedMotion) {
            gsap.fromTo(border, { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'power2.out', transformOrigin: 'top' });
            gsap.fromTo(content, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.4, ease: 'power2.out' });
            gsap.to(icon, { rotation: 45, duration: 0.3 });
          } else {
            if (content) content.style.maxHeight = '500px';
          }
          header.setAttribute('aria-expanded', 'true');
        }
      });
    }
  });

  // Set initial open state for first active accordion item on load
  const initialActiveItem = document.querySelector('.accordion-item.active');
  if (initialActiveItem) {
    const border = initialActiveItem.querySelector('.accordion-border');
    const content = initialActiveItem.querySelector('.accordion-content');
    const icon = initialActiveItem.querySelector('.accordion-icon');
    if (!prefersReducedMotion) {
      gsap.set(border, { scaleY: 1 });
      gsap.set(content, { height: 'auto', opacity: 1 });
      gsap.set(icon, { rotation: 45 });
    } else {
      if (content) content.style.maxHeight = '500px';
    }
  }

  // ==========================================================================
  // 7. MOTION & ANIMATIONS (Only runs if user hasn't requested reduced motion)
  // ==========================================================================
  if (!prefersReducedMotion) {
    
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    // Initialize Lenis smooth scroll
    lenis = new Lenis({
      lerp: 0.08,
      duration: 1.2,
      smoothWheel: true
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Canvas Particles Background (Hero Section)
    const canvas = document.getElementById('hero-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let particlesArray = [];
      let mouse = { x: null, y: null, radius: 120 };

      function resizeCanvas() {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        initParticles();
      }

      window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });

      window.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
      });

      class Particle {
        constructor(x, y) {
          this.baseX = x;
          this.baseY = y;
          this.x = x;
          this.y = y;
          this.vx = (Math.random() - 0.5) * 0.4;
          this.vy = (Math.random() - 0.5) * 0.4;
          this.radius = Math.random() * 1.5 + 1.5;
          this.opacity = Math.random() * 0.15 + 0.15;
        }

        draw() {
          ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        update() {
          this.baseX += this.vx;
          this.baseY += this.vy;

          if (this.baseX < 0) this.baseX = canvas.width;
          if (this.baseX > canvas.width) this.baseX = 0;
          if (this.baseY < 0) this.baseY = canvas.height;
          if (this.baseY > canvas.height) this.baseY = 0;

          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.baseX;
            const dy = mouse.y - this.baseY;
            const distance = Math.hypot(dx, dy);

            if (distance < mouse.radius) {
              const force = (mouse.radius - distance) / mouse.radius;
              const repelForce = force * 24;
              const angle = Math.atan2(dy, dx);
              const targetX = this.baseX - Math.cos(angle) * repelForce;
              const targetY = this.baseY - Math.sin(angle) * repelForce;

              this.x += (targetX - this.x) * 0.1;
              this.y += (targetY - this.y) * 0.1;
            } else {
              this.x += (this.baseX - this.x) * 0.1;
              this.y += (this.baseY - this.y) * 0.1;
            }
          } else {
            this.x += (this.baseX - this.x) * 0.1;
            this.y += (this.baseY - this.y) * 0.1;
          }
        }
      }

      function initParticles() {
        particlesArray = [];
        const numberOfParticles = Math.floor((canvas.width * canvas.height) / 9000);
        const boundedNum = Math.min(Math.max(numberOfParticles, 60), 130);

        for (let i = 0; i < boundedNum; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          particlesArray.push(new Particle(x, y));
        }
      }

      let animationId;
      function animateParticles() {
        if (document.visibilityState === 'visible') {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
          }
        }
        animationId = requestAnimationFrame(animateParticles);
      }

      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      animateParticles();
    }

    // Pause canvas and global timeline when tab is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        gsap.globalTimeline.pause();
      } else {
        gsap.globalTimeline.resume();
      }
    });

    // Word-by-word headline animation on load
    const words = document.querySelectorAll('.hero-title .word');
    gsap.fromTo(words,
      { y: 80, opacity: 0, rotateX: -40 },
      { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', delay: 0.3 }
    );

    // Full page load sequence (GSAP timeline)
    const tl = gsap.timeline({ delay: 0.2 });
    tl.fromTo('.navbar', { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' })
      .fromTo('.hero-overline', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2')
      .fromTo('.hero-subtext', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=0.2')
      .fromTo('.hero-ctas', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.1')
      .fromTo('.hero-stats-row', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.3')
      .fromTo('.hero-ticker', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, '-=0.2');

    // Stats Bar — Count-Up Animation
    gsap.utils.toArray('.stat-number').forEach(stat => {
      const targetAttr = stat.getAttribute('data-target');
      if (!targetAttr) return; // skip non-numeric e.g. "Global"
      const target = parseInt(targetAttr);
      ScrollTrigger.create({
        trigger: stat,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          const counterObj = { val: 0 };
          gsap.to(counterObj, {
            val: target,
            duration: 2,
            ease: 'power2.out',
            onUpdate: () => {
              stat.textContent = Math.round(counterObj.val) + (stat.getAttribute('data-suffix') || '');
            }
          });
        }
      });
    });

    // Who Is IMBS For — Card scroll animation
    gsap.fromTo('.who-card',
      { y: 60, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 0.7, stagger: 0.15, ease: 'power2.out',
        scrollTrigger: { trigger: '.who-section', start: 'top 75%' }
      }
    );

    // Programs Section — Stack, Zoom-Out, and Grid Arrange (Desktop Only)
    const stackContainer = document.querySelector('.programs-stack-container');
    const stickyWrapper = document.querySelector('.programs-sticky-wrapper');
    if (stackContainer && stickyWrapper) {
      const stackCards = gsap.utils.toArray('.program-stack-card');
      const mediaQuery = window.matchMedia('(min-width: 992px)');
      let mainTl;

      function initStackAndGridTimeline(e) {
        if (e.matches) {
          const totalCards = stackCards.length;
          const offscreenY = window.innerHeight + 200;

          // Initial state: Card 0 centered, Cards 1-7 offscreen below
          gsap.set(stackCards[0], { xPercent: -50, yPercent: -50, y: 0, scale: 1, opacity: 1, left: '50%', top: '50%' });
          stackCards.slice(1).forEach(card => {
            gsap.set(card, { xPercent: -50, yPercent: -50, y: offscreenY, scale: 1, opacity: 1, left: '50%', top: '50%' });
          });

          mainTl = gsap.timeline({
            scrollTrigger: {
              trigger: stackContainer,
              start: 'top 80px',
              end: 'bottom bottom',
              scrub: 2,
              pin: '.programs-sticky-wrapper',
              pinSpacing: false,
              id: 'main-stack-trigger'
            }
          });

          // Phase A: Stack cards one after another
          for (let i = 1; i < totalCards; i++) {
            mainTl.to(stackCards[i], { y: 0, duration: 1, ease: 'power2.inOut' });
            mainTl.to({}, { duration: 0.5 });
          }

          // Phase B: Zoom out and spread into 4×2 grid
          const cols = 4;
          const cardWidth = 220;
          const cardHeight = 200;
          const gap = 20;

          mainTl.to(stackCards, { scale: 0.45, duration: 1.5, ease: 'power2.out' }, '+=0.5');

          stackCards.forEach((card, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const targetX = (col - (cols - 1) / 2) * (cardWidth + gap);
            const targetY = (row - 0.5) * (cardHeight + gap);
            mainTl.to(card, { x: targetX, y: targetY, duration: 1.5, ease: 'power3.inOut' }, '<');
          });

          // Hold final grid state before unpinning
          mainTl.to({}, { duration: 1.0 });

        } else {
          const trigger = ScrollTrigger.getById('main-stack-trigger');
          if (trigger) trigger.kill();
          if (mainTl) { mainTl.kill(); mainTl = null; }
          gsap.set('.program-stack-card', { clearProps: 'all' });
        }
      }

      mediaQuery.addEventListener('change', initStackAndGridTimeline);
      initStackAndGridTimeline(mediaQuery);
    }

    // How It Works — SVG Line Draw
    const line = document.querySelector('.steps-line');
    const length = 1000;
    if (line) {
      gsap.fromTo(line,
        { strokeDashoffset: length, strokeDasharray: length },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: '.how-it-works-section',
            start: 'top 60%',
            end: 'bottom 60%',
            scrub: 1
          }
        }
      );
    }

    // Step blocks animate in with stagger
    gsap.fromTo('.step-block',
      { y: 50, opacity: 0 },
      {
        y: 0, opacity: 1, stagger: 0.2, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: '.how-it-works-section', start: 'top 70%' }
      }
    );

    // Section Scroll Reveal — Apply Globally
    gsap.utils.toArray('.reveal-up').forEach(el => {
      gsap.fromTo(el,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 80%', once: true }
        }
      );
    });

    // Navbar Scroll Color Styling trigger
    ScrollTrigger.create({
      start: 'top -80px',
      onUpdate: (self) => {
        const navEl = document.querySelector('.navbar');
        if (self.scroll() > 80) {
          gsap.to(navEl, {
            backgroundColor: 'rgba(28, 47, 110, 0.95)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 2px 30px rgba(0,0,0,0.3)',
            duration: 0.3
          });
        } else {
          gsap.to(navEl, {
            backgroundColor: '#1C2F6E',
            boxShadow: 'none',
            duration: 0.3
          });
        }
      }
    });

    // Refresh ScrollTrigger after Lenis init
    ScrollTrigger.refresh();
  } else {
    // If user prefers reduced motion, disable scroll behaviors
    document.documentElement.style.scrollBehavior = 'smooth';
  }

});

// Force ScrollTrigger refresh once all images/stylesheets are fully loaded
window.addEventListener('load', () => {
  ScrollTrigger.refresh();
});
