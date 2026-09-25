// Intro loader: cycles a greeting through several languages on every load
const introWords = [
  'Hello', 'Olá', '你好', 'Merhaba', 'Привет', 'Ciao', 'வணக்கம்',
  'Guten Tag', '안녕하세요', 'Hola', 'こんにちは', 'مرحبا', 'Hallå', 'Bonjour', 'Namaste',
];

// Cycles through white + the 4 accent colors used for the glow on the
// Experience cards (coral/mint/violet/amber), repeating so each of the
// 5 colors covers exactly 3 of the 15 words.
const introColors = ['#ffffff', 'var(--coral)', 'var(--mint)', 'var(--accent-purple-bright)', 'var(--amber)'];

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
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
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

// Shared focus-trap helper for both modals below: keeps Tab/Shift+Tab
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

// Company tile -> experience detail popup
const expModal = document.getElementById('expModal');
const expModalPanel = expModal.querySelector('.exp-modal-panel');
const expModalBody = expModal.querySelector('.exp-modal-body');

function openExpModal(item) {
  const template = document.getElementById(item.dataset.target);
  if (!template) return;
  lastFocusedEl = document.activeElement;
  expModalBody.innerHTML = '';
  expModalBody.appendChild(template.content.cloneNode(true));
  expModalPanel.dataset.accent = item.dataset.accent;
  expModal.classList.add('open');
  expModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  expModal.querySelector('.exp-modal-close').focus();
}

function closeExpModal() {
  expModal.classList.remove('open');
  expModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  lastFocusedEl?.focus();
}

document.querySelectorAll('.company-item').forEach((item) => {
  item.addEventListener('click', () => openExpModal(item));
});

expModal.querySelectorAll('[data-close]').forEach((el) => {
  el.addEventListener('click', closeExpModal);
});

document.addEventListener('keydown', (e) => {
  if (!expModal.classList.contains('open')) return;
  if (e.key === 'Escape') closeExpModal();
  else trapFocus(e, expModalPanel);
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
