/* ==========================================================================
   IMBS WEBSITE - INTERACTIVE LOGIC (app.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {

  // Wrap animations in a reduced-motion media query check
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenis;
  let siteWhatsappNumber = null;

  // ==========================================================================
  // 0. Pay Fee — Desktop nav button & Mobile menu item injection
  // ==========================================================================
  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
    const payBtn = document.createElement('a');
    payBtn.href = 'pay.html';
    payBtn.className = 'btn-pay-online';
    payBtn.setAttribute('aria-label', 'Pay Fee Online');
    payBtn.innerHTML = '<svg class="student-login-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>';
    navActions.insertBefore(payBtn, navActions.firstChild);
  }

  const mobileMenuList = document.querySelector('.mobile-menu-list');
  if (mobileMenuList) {
    const aboutLi = [...mobileMenuList.querySelectorAll('li')].find(li => {
      const a = li.querySelector('a');
      return a && a.getAttribute('href') === 'about.html';
    });
    if (aboutLi) {
      const payLi = document.createElement('li');
      payLi.innerHTML = '<a href="pay.html" class="mobile-menu-link">Pay Online</a>';
      aboutLi.after(payLi);
    }
  }

  // ==========================================================================
  // 1. Mobile Navigation Hamburger Overlay (Runs regardless of motion preferences)
  // ==========================================================================
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu-overlay');

  function updateNavbarScroll() {
    if (!navbar) return;
    const isScrolled = window.scrollY > 80;

    gsap.to(navbar, {
      backgroundColor: isScrolled ? 'rgba(252, 250, 242, 0.95)' : '#FCFAF2',
      backdropFilter: isScrolled ? 'blur(12px)' : 'none',
      boxShadow: isScrolled ? '0 2px 20px rgba(0, 0, 0, 0.08)' : 'none',
      duration: 0.3
    });
  }

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
      link.addEventListener('click', (e) => {
        if (link.getAttribute('href') === '#') {
          return;
        }
        mobileMenu.classList.remove('active');
        hamburger.classList.remove('active');
        gsap.to('#hamburger span:nth-child(1)', { rotation: 0, y: 0, duration: 0.2 });
        gsap.to('#hamburger span:nth-child(2)', { opacity: 1, duration: 0.2 });
        gsap.to('#hamburger span:nth-child(3)', { rotation: 0, y: 0, duration: 0.2 });
      });
    });

    // Dynamic Mobile Menu Dropdown for Programs
    const mobileProgLink = document.querySelector('.mobile-menu-link[href="index.html#programs"]');
    if (mobileProgLink) {
      mobileProgLink.setAttribute('href', '#');
      mobileProgLink.style.display = 'flex';
      mobileProgLink.style.justifyContent = 'space-between';
      mobileProgLink.style.alignItems = 'center';
      mobileProgLink.innerHTML = 'Programs <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style="margin-left: 8px; transition: transform 0.2s;"><path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      
      const submenu = document.createElement('ul');
      submenu.className = 'mobile-submenu';
      submenu.style.display = 'none';
      submenu.style.listStyle = 'none';
      submenu.style.paddingLeft = '20px';
      submenu.style.marginTop = '10px';
      submenu.style.flexDirection = 'column';
      submenu.style.gap = '10px';
      
      const pathways = [
        { name: 'Doctorate', id: 'doctorate' },
        { name: 'Post Graduate', id: 'masters' },
        { name: 'Graduate', id: 'graduation' },
        { name: 'Diploma', id: 'diploma' },
        { name: 'Adv. Diploma', id: 'adv-diploma' },
        { name: 'PG Diploma', id: 'pg-diploma' },
        { name: 'MDP', id: 'mdp' },
        { name: 'Certificate', id: 'certification' }
      ];
      
      submenu.innerHTML = pathways.map(p => `
        <li><a href="category.html?category=${p.id}" class="mobile-menu-link" style="font-size: 15px; font-weight: normal; padding: 4px 0;">${p.name}</a></li>
      `).join('');
      
      mobileProgLink.parentNode.appendChild(submenu);
      
      mobileProgLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isVisible = submenu.style.display === 'flex';
        submenu.style.display = isVisible ? 'none' : 'flex';
        const arrow = mobileProgLink.querySelector('svg');
        if (arrow) {
          arrow.style.transform = isVisible ? 'none' : 'rotate(180deg)';
        }
      });
    }
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
    brochureForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('brochure-name').value.trim();
      const email = document.getElementById('brochure-email').value.trim();
      const phone = document.getElementById('brochure-phone').value.trim();

      if (name && email && phone) {
        // Save lead before redirecting
        try {
          await fetch('api.php?action=save_lead', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, source: 'brochure_request' })
          });
        } catch (err) {
          console.warn('IMBS: Lead save failed', err);
        }

        const cardContent = brochureModal.querySelector('.modal-card');
        const originalContent = cardContent.innerHTML;

        cardContent.innerHTML = `
          <h3 class="modal-title">Thank You!</h3>
          <p class="modal-desc" style="margin-top: 15px; font-size: 16px; color: var(--white);">
            Your request has been received. Redirecting you to WhatsApp to get your brochure…
          </p>
        `;

        const waNum = siteWhatsappNumber || '7702251899';
        const waText = encodeURIComponent(
          `Hello, I have submitted my details to request the program brochure. Name: ${name}, Email: ${email}, Phone: ${phone}.`
        );
        const waUrl = `https://wa.me/${waNum}?text=${waText}`;

        setTimeout(() => {
          window.open(waUrl, '_blank', 'noopener');
          closeModal();
          setTimeout(() => {
            cardContent.innerHTML = originalContent;
            document.getElementById('close-brochure-modal').addEventListener('click', closeModal);
            setupFloatLabels();
          }, 300);
        }, 1200);
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
  let categoryMap = {}; // populated by fetchAndRenderCourses

  function scrollToCard(index) {
    if (prefersReducedMotion) {
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
        const cardCount = document.querySelectorAll('.program-stack-card').length || 8;
        const targetScroll = startOffset + (index * (totalScroll / cardCount)) + 50;
        if (lenis) {
          lenis.scrollTo(targetScroll, { duration: 1.5 });
        } else {
          window.scrollTo({ top: targetScroll, behavior: 'smooth' });
        }
      }
    }
  }

  // Mega menu: links navigate directly to category.html via href (interceptor removed)
  // Footer links: navigate directly to category.html via href (interceptor removed)

  // ==========================================================================
  // Wire all "Talk to an Advisor" elements to open WhatsApp
  function wireAdvisorCtas(waNum) {
    const advisorText = 'Talk to an Advisor';
    const waUrl = `https://wa.me/${waNum}?text=${encodeURIComponent('Hello, I would like to speak with an admissions advisor regarding IMBS programs.')}`;
    document.querySelectorAll('a, button').forEach(el => {
      if (el.textContent.trim() !== advisorText) return;
      if (el.tagName === 'A') {
        el.href = waUrl;
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener');
        el.removeAttribute('onclick');
      } else {
        el.removeAttribute('onclick');
        el.addEventListener('click', () => window.open(waUrl, '_blank', 'noopener'));
      }
    });
  }

  // Fetch courses & categories from API, then render mega menu + program cards
  // ==========================================================================
  async function safeFetchJson(apiUrl, fallbackUrl) {
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error('Response not OK');
      const text = await res.text();
      return JSON.parse(text);
    } catch (e) {
      console.warn(`API failed for ${apiUrl}, trying fallback: ${fallbackUrl}`, e);
      const res = await fetch(fallbackUrl);
      if (!res.ok) throw new Error('Fallback failed');
      return await res.json();
    }
  }

  // ==========================================================================
  // CMS Content Fetch & Render (homepage.json, faqs.json, testimonials.json)
  // ==========================================================================
  async function fetchAndRenderCmsContent() {
    let homepage = {}, faqs = [], testimonials = [];
    try {
      [homepage, faqs, testimonials] = await Promise.all([
        safeFetchJson('api.php?action=get_homepage', 'data/homepage.json'),
        safeFetchJson('api.php?action=get_faqs', 'data/faqs.json'),
        safeFetchJson('api.php?action=get_testimonials', 'data/testimonials.json'),
      ]);
    } catch (err) {
      console.warn('IMBS: Failed to load CMS content.', err);
      return;
    }

    // ── Hero Section ──────────────────────────────────────────────────────────
    const hero = homepage.hero || {};
    if (hero.overline) {
      const el = document.getElementById('hero-overline');
      if (el) el.textContent = hero.overline;
    }
    if (hero.description) {
      const el = document.getElementById('hero-desc');
      if (el) el.textContent = hero.description;
    }
    if (hero.video_src) {
      const video = document.querySelector('.hero-video source');
      if (video) { video.src = hero.video_src; video.parentElement.load(); }
    }
    if (hero.cta_primary_label || hero.cta_primary_href) {
      const btn = document.querySelector('.hero-ctas .btn-primary-red');
      if (btn) {
        if (hero.cta_primary_label) btn.textContent = hero.cta_primary_label;
        if (hero.cta_primary_href)  btn.href = hero.cta_primary_href;
      }
    }
    if (hero.stats && hero.stats.length) {
      const statItems = document.querySelectorAll('.hero-stat-item');
      hero.stats.forEach((s, i) => {
        if (statItems[i]) {
          const val = statItems[i].querySelector('.hero-stat-val');
          const lbl = statItems[i].querySelector('.hero-stat-lbl');
          if (val && s.value) val.textContent = s.value;
          if (lbl && s.label) lbl.textContent = s.label;
        }
      });
    }

    // ── Stats Bar ─────────────────────────────────────────────────────────────
    const statBarItems = homepage.stats_bar || [];
    if (statBarItems.length) {
      const statCols = document.querySelectorAll('.stat-col');
      statBarItems.forEach((s, i) => {
        if (!statCols[i]) return;
        const numEl = statCols[i].querySelector('.stat-number');
        const lblEl = statCols[i].querySelector('.stat-label');
        if (lblEl && s.label) lblEl.textContent = s.label;
        if (numEl) {
          if (s.text) {
            numEl.removeAttribute('data-target');
            numEl.removeAttribute('data-suffix');
            numEl.textContent = s.text;
          } else {
            numEl.setAttribute('data-target', String(s.value || 0));
            numEl.setAttribute('data-suffix', s.suffix || '');
            numEl.textContent = '0';
          }
        }
      });
    }

    // ── Who Is It For ─────────────────────────────────────────────────────────
    const who = homepage.who_is_for || {};
    if (who.overline) {
      const el = document.querySelector('.who-section .overline-label');
      if (el) el.textContent = who.overline;
    }
    if (who.heading) {
      const el = document.querySelector('.who-section .section-title-dark');
      if (el) el.textContent = who.heading;
    }
    if (who.cards && who.cards.length) {
      const cards = document.querySelectorAll('.who-card');
      who.cards.forEach((c, i) => {
        if (!cards[i]) return;
        const bg    = cards[i].querySelector('.who-card-bg');
        const title = cards[i].querySelector('.who-card-title');
        const body  = cards[i].querySelector('.who-card-body');
        const link  = cards[i].querySelector('.who-card-link');
        if (bg    && c.image)    bg.style.backgroundImage = `url('${c.image}')`;
        if (title && c.title)    title.textContent = c.title;
        if (body  && c.body)     body.textContent  = c.body;
        if (link  && c.cta_href) link.href = c.cta_href;
      });
    }

    // ── Enrollment Steps ─────────────────────────────────────────────────────
    const enroll = homepage.enrollment_steps || {};
    if (enroll.overline) {
      const el = document.querySelector('.how-it-works .overline-label');
      if (el) el.textContent = enroll.overline;
    }
    if (enroll.heading) {
      const el = document.querySelector('.how-it-works .section-title-white');
      if (el) el.textContent = enroll.heading;
    }
    if (enroll.steps && enroll.steps.length) {
      const blocks = document.querySelectorAll('.step-block');
      enroll.steps.forEach((s, i) => {
        if (!blocks[i]) return;
        const num   = blocks[i].querySelector('.step-num-bg');
        const title = blocks[i].querySelector('.step-title');
        const desc  = blocks[i].querySelector('.step-desc');
        if (num   && s.number)      num.textContent   = s.number;
        if (title && s.title)       title.textContent = s.title;
        if (desc  && s.description) desc.textContent  = s.description;
      });
    }

    // ── Footer Social Links ───────────────────────────────────────────────────
    const footer = homepage.footer || {};
    if (footer.whatsapp_number) {
      const wa = document.querySelector('.whatsapp-link');
      if (wa) wa.href = `https://wa.me/${footer.whatsapp_number.replace(/\D/g,'')}`;
      siteWhatsappNumber = footer.whatsapp_number.replace(/\D/g, '');
      wireAdvisorCtas(siteWhatsappNumber);
    }
    const socialIcons = document.querySelectorAll('.footer-social-icon');
    const socialLinks = [footer.linkedin_url, footer.instagram_url, footer.twitter_url];
    socialIcons.forEach((icon, i) => {
      if (socialLinks[i] && socialLinks[i] !== '#') icon.href = socialLinks[i];
    });
    if (footer.phone) {
      const phoneEl = document.querySelector('.contact-item:first-child span');
      if (phoneEl) phoneEl.textContent = footer.phone;
    }
    if (footer.email) {
      const emailEl = document.querySelector('.contact-item:nth-child(2) span');
      if (emailEl) emailEl.textContent = footer.email;
    }
    if (footer.address) {
      const addrEl = document.querySelector('.contact-item:nth-child(3) span');
      if (addrEl) addrEl.textContent = footer.address;
    }

    // ── Why IMBS — Accordion (FAQs) ───────────────────────────────────────────
    if (faqs && faqs.length) {
      const accordionList = document.querySelector('.accordion-list');
      if (accordionList) {
        accordionList.innerHTML = faqs.map((f, i) => `
          <div class="accordion-item${i === 0 ? ' active' : ''}" id="acc-${i+1}">
            <div class="accordion-border"></div>
            <button class="accordion-header" aria-expanded="${i === 0}" aria-controls="acc-body-${i+1}">
              <span class="accordion-title">${escHtml(f.title || '')}</span>
              <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-body-wrapper accordion-content" id="acc-body-${i+1}"${i === 0 ? ' style="max-height:500px;"' : ''}>
              <p class="accordion-body">${escHtml(f.body || '')}</p>
            </div>
          </div>
        `).join('');
        // Initialize active accordion state after re-render
        initAccordions();
      }
    }

    // ── Testimonials (site-wide) ──────────────────────────────────────────────
    if (testimonials && testimonials.length) {
      const track = document.getElementById('testimonials-track');
      if (track) {
        track.innerHTML = testimonials.map(t => `
          <div class="testimonial-card">
            <span class="quote-mark">"</span>
            <p class="testimonial-quote">${escHtml(t.quote || '')}</p>
            <div class="testimonial-author">
              <span class="author-name">${escHtml(t.name || '')}</span>
              <span class="author-program">${escHtml(t.program || '')}</span>
            </div>
          </div>
        `).join('');
        // Re-init testimonial slider with new cards
        initTestimonialSlider();
      }
    }
  }

  // XSS-safe HTML escaping for CMS content injected into innerHTML
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function initAccordions() {
    const firstActive = document.querySelector('.accordion-item.active');
    if (firstActive) {
      const c = firstActive.querySelector('.accordion-content');
      const b = firstActive.querySelector('.accordion-border');
      const ic = firstActive.querySelector('.accordion-icon');
      if (!prefersReducedMotion && typeof gsap !== 'undefined') {
        gsap.set(b, { scaleY: 1 });
        gsap.set(c, { height: 'auto', opacity: 1, maxHeight: 'none' });
        gsap.set(ic, { rotation: 45 });
      } else if (c) {
        c.style.maxHeight = '500px';
      }
    }
  }

  function initTestimonialSlider() {
    const track = document.getElementById('testimonials-track');
    if (!track) return;
    const cards = track.querySelectorAll('.testimonial-card');
    const total = cards.length;
    let idx = 0;

    function getPerView() {
      if (window.innerWidth < 768) return 1;
      if (window.innerWidth < 1280) return 2;
      return 3;
    }

    function slide() {
      const perView = getPerView();
      const max = Math.max(0, total - perView);
      if (idx > max) idx = max;
      const cardWidth = cards[0]?.offsetWidth || 0;
      const moveX = -idx * (cardWidth + 32);
      if (!prefersReducedMotion && typeof gsap !== 'undefined') {
        gsap.to(track, { x: moveX, duration: 0.6, ease: 'power2.out' });
      } else {
        track.style.transform = `translateX(${moveX}px)`;
      }
    }

    const prev = document.getElementById('prev-testimonial');
    const next = document.getElementById('next-testimonial');
    if (prev) prev.onclick = () => { const pv = getPerView(); if (idx > 0) idx--; else idx = Math.max(0, total - pv); slide(); };
    if (next) next.onclick = () => { const pv = getPerView(); if (idx < total - pv) idx++; else idx = 0; slide(); };
    window.addEventListener('resize', slide);
  }

  await fetchAndRenderCmsContent();

  async function fetchAndRenderCourses() {
    let courses = [], categories = [], accreditations = [], partners = [];
    try {
      [courses, categories, accreditations, partners] = await Promise.all([
        safeFetchJson('api.php?action=get_courses', 'data/courses.json'),
        safeFetchJson('api.php?action=get_categories', 'data/categories.json'),
        safeFetchJson('api.php?action=get_accreditations', 'data/accreditations.json'),
        safeFetchJson('api.php?action=get_partners', 'data/partners.json')
      ]);
    } catch (err) {
      console.warn('IMBS: Failed to load course data.', err);
      return;
    }

    const arrowSvg = `<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    // Rebuild categoryMap from API-defined order
    categoryMap = {};
    categories.forEach((cat, i) => { categoryMap[cat.id] = i; });

    // Render mega menu links
    const megaMenuEl = document.getElementById('dynamic-mega-menu');
    if (megaMenuEl) {
      megaMenuEl.innerHTML = categories.map(cat => `
        <a href="category.html?category=${cat.id}" class="mega-menu-item" data-tab="${cat.id}">
          <span class="mega-menu-title">${cat.name} ${arrowSvg}</span>
          <span class="mega-menu-desc">${cat.overview}</span>
        </a>
      `).join('');
    }

    // Render program stack cards
    const cardStackEl = document.getElementById('dynamic-program-cards');
    if (cardStackEl) {
      cardStackEl.innerHTML = categories.map((cat, index) => {
        const catCourses = courses.filter(c => c.category === cat.id && c.status === 'active');
        const firstCourse = catCourses[0];
        const duration = firstCourse?.hero?.duration || '—';
        const eligibility = firstCourse?.hero?.eligibility || '—';
        const featured = catCourses.filter(c => c.featured);
        const displayList = (featured.length ? featured : catCourses).slice(0, 3);

        return `
          <div class="program-stack-card" data-index="${index}">
            <div class="program-card-grid">
              <div class="program-card-left">
                <span class="category-label red-overline">${cat.name}</span>
                <h3 class="category-title text-white">${cat.name} Pathways</h3>
                <p class="category-desc">${cat.overview}</p>
                <div class="category-meta">
                  <div class="meta-item">
                    <span class="meta-label">Duration:</span>
                    <span class="meta-value">${duration}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Eligibility:</span>
                    <span class="meta-value">${eligibility}</span>
                  </div>
                </div>
                <a href="category.html?category=${cat.id}" class="btn btn-outline-white card-cta">Explore Programs &rarr;</a>
              </div>
              <div class="program-card-right">
                <div class="program-card-img-wrap img-overlay-wrap">
                  <img class="program-card-img" src="${cat.banner_image}" alt="${cat.name} Pathways">
                </div>
                <div class="featured-list-wrap">
                  <h4 class="featured-list-title">Featured Programs</h4>
                  <ul class="featured-programs-list">
                    ${displayList.map(c => `<li><a href="course.html?slug=${c.slug}">${c.title}</a></li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Render desktop tabbed switcher
    const tabsListEl = document.getElementById('programs-tabs-list');
    const tabsContentEl = document.getElementById('programs-tabs-content');
    if (tabsListEl && tabsContentEl && categories.length > 0) {
      // Helper function to generate card HTML
      function getCardHtml(cat, index) {
        const catCourses = courses.filter(c => c.category === cat.id && c.status === 'active');
        const firstCourse = catCourses[0];
        const duration = firstCourse?.hero?.duration || '—';
        const eligibility = firstCourse?.hero?.eligibility || '—';
        const featured = catCourses.filter(c => c.featured);
        const displayList = (featured.length ? featured : catCourses).slice(0, 3);
        
        return `
          <div class="program-stack-card" data-index="${index}">
            <div class="program-card-grid">
              <div class="program-card-left">
                <span class="category-label red-overline">${cat.name}</span>
                <h3 class="category-title text-white">${cat.name} Pathways</h3>
                <p class="category-desc">${cat.overview}</p>
                <div class="category-meta">
                  <div class="meta-item">
                    <span class="meta-label">Duration:</span>
                    <span class="meta-value">${duration}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">Eligibility:</span>
                    <span class="meta-value">${eligibility}</span>
                  </div>
                </div>
                <a href="category.html?category=${cat.id}" class="btn btn-outline-white card-cta">Explore Programs &rarr;</a>
              </div>
              <div class="program-card-right">
                <div class="program-card-img-wrap img-overlay-wrap">
                  <img class="program-card-img" src="${cat.banner_image}" alt="${cat.name} Pathways">
                </div>
                <div class="featured-list-wrap">
                  <h4 class="featured-list-title">Featured Programs</h4>
                  <ul class="featured-programs-list">
                    ${displayList.map(c => `<li><a href="course.html?slug=${c.slug}">${c.title}</a></li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // Render tabs list
      tabsListEl.innerHTML = categories.map((cat, index) => `
        <button class="program-tab-btn ${index === 0 ? 'active' : ''}" data-tab-index="${index}">
          ${cat.name}
        </button>
      `).join('');

      // Render default first card
      tabsContentEl.innerHTML = getCardHtml(categories[0], 0);

      // Bind click triggers
      const tabBtns = tabsListEl.querySelectorAll('.program-tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetIndex = parseInt(btn.getAttribute('data-tab-index'), 10);
          if (btn.classList.contains('active')) return;
          
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          gsap.to(tabsContentEl, {
            opacity: 0,
            y: 10,
            duration: 0.15,
            ease: 'power1.in',
            onComplete: () => {
              tabsContentEl.innerHTML = getCardHtml(categories[targetIndex], targetIndex);
              gsap.fromTo(tabsContentEl,
                { opacity: 0, y: -10 },
                { opacity: 1, y: 0, duration: 0.3, ease: 'power1.out' }
              );
            }
          });
        });
      });
    }

    // Render accreditations badges strip (homepage + accreditations page)
    const accredsEl = document.getElementById('accred-badges');
    if (accredsEl && accreditations.length) {
      accredsEl.innerHTML = accreditations.map(acc => `
        <div class="accred-pill" title="${acc.name}">${acc.acronym} ${acc.region ? `(${acc.region})` : ''}</div>
      `).join('');
    }

    // Render accreditations detail grid (accreditations.html)
    const accredDetailGrid = document.getElementById('accred-detail-grid');
    if (accredDetailGrid && accreditations.length) {
      accredDetailGrid.innerHTML = accreditations.map(acc => `
        <div class="accred-detail-card reveal-up">
          <div class="accred-card-acronym">${acc.acronym}</div>
          <div class="accred-card-name">${acc.name}</div>
          <div class="accred-card-meta">
            ${acc.region ? `<span class="accred-card-tag accred-card-tag--region">${acc.region}</span>` : ''}
            ${acc.type ? `<span class="accred-card-tag">${acc.type}</span>` : ''}
          </div>
          <p class="accred-card-desc">${acc.description}</p>
          ${acc.url ? `<a href="${acc.url}" target="_blank" rel="noopener" class="accred-card-link">Official Website &rarr;</a>` : ''}
        </div>
      `).join('');
    }

    // Render partners scrolling marquee (homepage + partners page)
    const marqueeElements = document.querySelectorAll('.partners-marquee');
    if (marqueeElements.length && partners.length) {
      const itemsMarkup = partners.map(p => `
        <div class="partner-logo-item">
          <img src="${p.logo}" alt="${p.name}" class="partner-logo-img">
        </div>
      `).join('');
      const markup = `<div class="partners-marquee-content">${itemsMarkup}</div>`;
      marqueeElements.forEach(el => {
        el.innerHTML = markup + markup.replace('partners-marquee-content', 'partners-marquee-content" aria-hidden="true');
      });
    }
  }

  await fetchAndRenderCourses();

  // ==========================================================================
  // 6. Accordion Interactive Enhancements (Global Event Delegation)
  // ==========================================================================
  document.addEventListener('click', (e) => {
    const header = e.target.closest('.accordion-item .accordion-header');
    if (!header) return;

    const item = header.closest('.accordion-item');
    if (!item) return;

    e.preventDefault();
    e.stopPropagation();

    const isActive = item.classList.contains('active');
    const container = item.closest('.accordion-list') || document;
    const items = container.querySelectorAll('.accordion-item');

    // Close all other active items
    items.forEach(other => {
      if (other !== item && other.classList.contains('active')) {
        other.classList.remove('active');
        const c = other.querySelector('.accordion-content');
        const ic = other.querySelector('.accordion-icon');
        const border = other.querySelector('.accordion-border');

        if (!prefersReducedMotion && typeof gsap !== 'undefined') {
          gsap.to(border, { scaleY: 0, duration: 0.3, ease: 'power2.out', transformOrigin: 'top' });
          gsap.to(c, {
            height: 0,
            opacity: 0,
            duration: 0.4,
            ease: 'power2.out',
            onComplete: () => {
              gsap.set(c, { clearProps: 'all' });
            }
          });
          gsap.to(ic, { rotation: 0, duration: 0.3, ease: 'power2.out' });
        } else {
          if (c) c.style.maxHeight = '0';
        }
        other.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
      }
    });

    const border  = item.querySelector('.accordion-border');
    const content = item.querySelector('.accordion-content');
    const icon    = item.querySelector('.accordion-icon');

    if (isActive) {
      item.classList.remove('active');
      if (!prefersReducedMotion && typeof gsap !== 'undefined') {
        gsap.to(border, { scaleY: 0, duration: 0.3, ease: 'power2.out', transformOrigin: 'top' });
        gsap.to(content, {
          height: 0,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(content, { clearProps: 'all' });
          }
        });
        gsap.to(icon, { rotation: 0, duration: 0.3, ease: 'power2.out' });
      } else {
        if (content) content.style.maxHeight = '0';
      }
      header.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('active');
      if (!prefersReducedMotion && typeof gsap !== 'undefined') {
        gsap.fromTo(border, { scaleY: 0 }, { scaleY: 1, duration: 0.3, ease: 'power2.out', transformOrigin: 'top' });
        gsap.fromTo(content, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, maxHeight: 'none', duration: 0.4, ease: 'power2.out' });
        gsap.to(icon, { rotation: 45, duration: 0.3, ease: 'power2.out' });
      } else {
        if (content) content.style.maxHeight = '500px';
      }
      header.setAttribute('aria-expanded', 'true');
    }
  });

  // Set initial open state for first active accordion item on load
  initAccordions();

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
    window.lenis = lenis;
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

      function animateParticles() {
        if (document.visibilityState === 'visible') {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
          }
        }
        requestAnimationFrame(animateParticles);
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
    if (words.length > 0) {
      gsap.fromTo(words,
        { y: 80, opacity: 0, rotateX: -40 },
        { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', delay: 0.3 }
      );
    }

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
    if (document.querySelector('.who-section')) {
      gsap.fromTo('.who-card',
        { y: 60, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, stagger: 0.15, ease: 'power2.out',
          scrollTrigger: { trigger: '.who-section', start: 'top 75%' }
        }
      );
    }

    // Tablet / Mobile View (≤991px): clear any GSAP transforms that desktop switcher might have set
    if (window.matchMedia('(max-width: 991px)').matches) {
      const mTrack = document.getElementById('dynamic-program-cards');
      if (mTrack) {
        gsap.set(mTrack, { clearProps: 'all' });
        mTrack.style.transform = '';
      }
    }

    // Mobile (≤767px): click-only arrow carousel — no scroll/touch interception, Lenis untouched
    (function() {
      'use strict';

      function initMobileCarousel() {
        if (!window.matchMedia('(max-width: 991px)').matches) return;

        const track = document.getElementById('dynamic-program-cards');
        if (!track) return;

        const cards = Array.from(track.children);
        const cardCount = cards.length;
        if (cardCount === 0) return;

        // Build dot container below the controls
        let dotsContainer = document.querySelector('.carousel-dots');
        if (!dotsContainer) {
          dotsContainer = document.createElement('div');
          dotsContainer.className = 'carousel-dots';
          const controls = document.querySelector('.mobile-carousel-controls');
          if (controls && controls.parentNode) {
            controls.parentNode.insertBefore(dotsContainer, controls.nextSibling);
          } else {
            track.parentNode.insertBefore(dotsContainer, track.nextSibling);
          }
        }

        if (dotsContainer.children.length !== cardCount) {
          dotsContainer.innerHTML = '';
          cards.forEach(function(_, i) {
            const dot = document.createElement('span');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', function() { goToCard(i); });
            dotsContainer.appendChild(dot);
          });
        }

        const dots = Array.from(dotsContainer.querySelectorAll('.carousel-dot'));
        const prevBtn = document.querySelector('.carousel-prev');
        const nextBtn = document.querySelector('.carousel-next');
        let currentIndex = 0;

        function goToCard(index) {
          if (index < 0 || index >= cardCount) return;
          currentIndex = index;

          const offset = -(currentIndex * track.offsetWidth);
          track.style.transform = 'translateX(' + offset + 'px)';

          dots.forEach(function(dot, i) {
            dot.classList.toggle('active', i === currentIndex);
          });

          if (prevBtn) prevBtn.disabled = currentIndex === 0;
          if (nextBtn) nextBtn.disabled = currentIndex === cardCount - 1;
        }

        // Initialise without transition so first card snaps instantly
        track.style.transition = 'none';
        goToCard(0);
        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          });
        });

        if (prevBtn) {
          prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            goToCard(currentIndex - 1);
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            goToCard(currentIndex + 1);
          });
        }

        window.addEventListener('resize', function() {
          if (!window.matchMedia('(max-width: 991px)').matches) return;
          track.style.transition = 'none';
          goToCard(currentIndex);
          requestAnimationFrame(function() {
            requestAnimationFrame(function() {
              track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            });
          });
        });
      }

      // Cards are rendered async via fetch — wait for them then init
      var pollTrack = document.getElementById('dynamic-program-cards');
      if (pollTrack) {
        if (pollTrack.children.length > 0) {
          initMobileCarousel();
        } else {
          var mo = new MutationObserver(function() {
            if (pollTrack.children.length > 0) {
              mo.disconnect();
              initMobileCarousel();
            }
          });
          mo.observe(pollTrack, { childList: true });
        }
      }
    })();

    // How It Works — SVG Line Draw
    const line = document.querySelector('.steps-line');
    const howItWorksSection = document.querySelector('.how-it-works-section');
    const length = 1000;
    if (line && howItWorksSection) {
      gsap.fromTo(line,
        { strokeDashoffset: length, strokeDasharray: length },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: howItWorksSection,
            start: 'top 60%',
            end: 'bottom 60%',
            scrub: 1
          }
        }
      );
    }

    // Step blocks animate in with stagger
    if (howItWorksSection) {
      gsap.fromTo('.step-block',
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.2, duration: 0.7, ease: 'power2.out',
          scrollTrigger: { trigger: howItWorksSection, start: 'top 70%' }
        }
      );
    }

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
      onUpdate: () => {
        updateNavbarScroll();
      }
    });

    // Refresh ScrollTrigger after Lenis init
    ScrollTrigger.refresh();
  } else {
    // If user prefers reduced motion, disable scroll behaviors
    document.documentElement.style.scrollBehavior = 'smooth';
    window.addEventListener('scroll', updateNavbarScroll);
    updateNavbarScroll();
  }

});

// Force ScrollTrigger refresh once all images/stylesheets are fully loaded
window.addEventListener('load', () => {
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
});
