// Intro loader: cycles a greeting through several languages on every load
const introWords = [
  'Hello', 'Olá', '你好', 'Merhaba', 'Привет', 'Ciao', 'வணக்கம்',
  'Guten Tag', '안녕하세요', 'Hola', 'こんにちは', 'مرحبا', 'Hallå', 'Bonjour', 'Namaste',
];

// Cycles through white + the 4 signature-gradient stops used for the
// Experience timeline dots, repeating so each of the 5 colors covers
// exactly 3 of the 15 words.
const introColors = ['#ffffff', 'var(--accent-indigo)', 'var(--accent-violet)', 'var(--accent-magenta)', 'var(--accent-coral)'];

const introLoader = document.getElementById('introLoader');
const introWord = document.getElementById('introWord');
const introDot = document.getElementById('introDot');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.body.style.overflow = 'hidden';

// Every word gets an identical slot, so total time = words.length * SLOT + FINAL_FADE.
// 15 * 180ms + 300ms = 3000ms exactly.
const SLOT = 180;
const FADE = 60;
const FINAL_FADE = 300;
const introTimeouts = [];

function endIntro() {
  introTimeouts.forEach(clearTimeout);
  introLoader.classList.add('fade-out');
  document.body.style.overflow = '';
  introTimeouts.push(setTimeout(() => introLoader.remove(), FINAL_FADE));
}

function playIntroWord(index) {
  const isLast = index === introWords.length - 1;
  introWord.style.opacity = 0;

  introTimeouts.push(setTimeout(() => {
    introWord.textContent = introWords[index];
    introWord.style.color = introColors[index % introColors.length];
    introDot.style.backgroundColor = introColors[index % introColors.length];
    introWord.style.opacity = 1;

    introTimeouts.push(setTimeout(() => {
      if (!isLast) {
        playIntroWord(index + 1);
      } else {
        endIntro();
      }
    }, SLOT - FADE));
  }, FADE));
}

// Respect prefers-reduced-motion: skip the cycling animation entirely.
// Otherwise, introWords[0] ("Hello") is already rendered in the HTML, so
// hold it for one equal slot before starting the fade sequence at index 1.
if (prefersReducedMotion) {
  endIntro();
} else {
  introTimeouts.push(setTimeout(() => playIntroWord(1), SLOT));
}

// Click (or tap) anywhere on the loader to skip straight to the site.
introLoader.addEventListener('click', endIntro);

// Mobile nav toggle
const navEl = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Shrinks and blurs the nav once the page has scrolled past the top.
const updateNavScrolled = () => {
  navEl.classList.toggle('scrolled', window.scrollY > 24);
};
updateNavScrolled();
window.addEventListener('scroll', updateNavScrolled, { passive: true });

// Highlights the nav link for whichever section is currently in view.
// rootMargin shrinks the trigger zone to a thin band around mid-viewport,
// so the active link swaps as a section crosses the middle of the screen
// rather than the moment it merely enters the viewport edge.
const navLinkByHref = new Map(
  Array.from(navLinks.querySelectorAll('a')).map((link) => [link.getAttribute('href'), link])
);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = navLinkByHref.get(`#${entry.target.id}`);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinkByHref.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  },
  { rootMargin: '-40% 0px -55% 0px' }
);

navLinkByHref.forEach((link, href) => {
  const section = document.querySelector(href);
  if (section) sectionObserver.observe(section);
});

// Reveal-on-scroll for elements marked .reveal
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// Focus-trap helper for the contact modal below: keeps Tab/Shift+Tab
// cycling within the open dialog, and restores focus to whatever
// triggered it once the dialog closes.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(e, panel) {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR));
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

let lastFocusedEl = null;

// Experience timeline: each entry expands/collapses independently in place
// (replaced the old click-to-open-modal pattern so the current role's
// achievements are visible without any click at all).
document.querySelectorAll('.timeline-toggle').forEach((toggle) => {
  toggle.addEventListener('click', () => {
    const item = toggle.closest('.timeline-item');
    const expanded = item.classList.toggle('is-expanded');
    toggle.setAttribute('aria-expanded', String(expanded));
  });
});

// "Submit Query" -> contact form popup
const contactModal = document.getElementById('contactModal');
const contactModalPanel = contactModal.querySelector('.exp-modal-panel');
const submitQueryBtn = document.getElementById('submitQueryBtn');
const queryForm = document.getElementById('queryForm');
const formStatus = document.getElementById('formStatus');

function openContactModal() {
  lastFocusedEl = document.activeElement;
  contactModal.classList.add('open');
  contactModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  document.getElementById('queryName').focus();
}

function closeContactModal() {
  contactModal.classList.remove('open');
  contactModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastFocusedEl?.focus();
}

submitQueryBtn.addEventListener('click', openContactModal);

contactModal.querySelectorAll('[data-close-contact]').forEach((el) => {
  el.addEventListener('click', closeContactModal);
});

document.addEventListener('keydown', (e) => {
  if (!contactModal.classList.contains('open')) return;
  if (e.key === 'Escape') closeContactModal();
  else trapFocus(e, contactModalPanel);
});

// Delivered via formsubmit.co - a no-signup form relay. The first real
// submission triggers a one-time confirmation email to activate the address.
queryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('sendMessageBtn');
  submitBtn.disabled = true;
  formStatus.textContent = 'Sending...';
  formStatus.className = 'form-status';

  try {
    const response = await fetch('https://formsubmit.co/ajax/karthikanandofficial@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: queryForm.name.value,
        email: queryForm.email.value,
        message: queryForm.message.value,
        _subject: `Portfolio query from ${queryForm.name.value}`,
      }),
    });

    if (!response.ok) throw new Error('Request failed');

    formStatus.textContent = "Message sent — I'll get back to you soon.";
    formStatus.className = 'form-status success';
    queryForm.reset();
    setTimeout(closeContactModal, 2000);
  } catch (err) {
    formStatus.textContent = 'Something went wrong — email me directly at karthikanandofficial@gmail.com.';
    formStatus.className = 'form-status error';
  } finally {
    submitBtn.disabled = false;
  }
});

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
