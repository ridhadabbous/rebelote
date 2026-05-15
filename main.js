/* ===========================
   ANIMATED BACKGROUND CANVAS
=========================== */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let particles = [];
let animFrameId;

if (canvas && ctx) {
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.floor((canvas.width * canvas.height) / 18000);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.5 ? '229,57,53' : '255,255,255',
      });
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 130) {
          const opacity = (1 - dist / 130) * 0.12;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(229,57,53,${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    }

    animFrameId = requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  createParticles();
  drawParticles();

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animFrameId);
    resizeCanvas();
    createParticles();
    drawParticles();
  });
}


/* ===========================
   NAVBAR SCROLL EFFECT
=========================== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

/* === HAMBURGER MENU === */
const hamburger = document.getElementById('nav-hamburger');
const navMobile = document.getElementById('nav-mobile');
if (hamburger && navMobile) {
  hamburger.addEventListener('click', () => {
    navMobile.classList.toggle('open');
  });
}


/* ===========================
   INTERSECTION OBSERVER – REVEAL ANIMATIONS
=========================== */
const revealTargets = document.querySelectorAll(
  '.service-block, .timeline-item, .city-chip, .city-card-primary, .store-badge, .app-name-reveal'
);

const revealStyles = `
  .reveal-hidden {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .reveal-visible {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
const styleEl = document.createElement('style');
styleEl.textContent = revealStyles;
document.head.appendChild(styleEl);

revealTargets.forEach((el, i) => {
  el.classList.add('reveal-hidden');
  el.style.transitionDelay = `${(i % 6) * 80}ms`;
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealTargets.forEach(el => observer.observe(el));

/* ===========================
   HERO TITLE WORD ANIMATION
=========================== */
document.querySelectorAll('.app-title-word').forEach((word, i) => {
  word.style.opacity = '0';
  word.style.transform = 'translateY(20px)';
  word.style.display = 'inline-block';
  word.style.transition = `opacity 0.5s ease ${400 + i * 120}ms, transform 0.5s ease ${400 + i * 120}ms`;
  setTimeout(() => {
    word.style.opacity = '1';
    word.style.transform = 'translateY(0)';
  }, 100);
});

/* ===========================
   PHONE CARD INTERACTIVITY
=========================== */
const cards = document.querySelectorAll('.service-card');
const screenTitle = document.querySelector('.screen-title');
const statusEl = document.querySelector('.screen-status span');

const cardData = {
  'card-food': { title: 'Order Food 🍔', status: 'Browsing 200+ restaurants near you' },
  'card-taxi': { title: 'Book a Taxi 🚕', status: 'Finding drivers near you…' },
  'card-ship': { title: 'Ship a Package 📦', status: 'Schedule a pickup instantly' },
};

cards.forEach(card => {
  card.addEventListener('click', () => {
    const data = cardData[card.id];
    if (data && screenTitle && statusEl) {
      screenTitle.textContent = data.title;
      statusEl.textContent = data.status;
      cards.forEach(c => c.style.outline = 'none');
      card.style.outline = '2px solid rgba(229,57,53,0.6)';
    }
  });
});

/* ===========================
   NOTIFY FORM
   Uses Web3Forms (https://web3forms.com) — free, no backend needed.
   The key is injected at deploy time from a GitHub Actions secret.
   To set it up:
     1. Go to https://web3forms.com
     2. Enter "support@myplace.tn" → "Create Access Key"
     3. In GitHub repo → Settings → Secrets → Actions → New secret
        Name: WEB3FORMS_KEY  /  Value: (your key)
=========================== */
const WEB3FORMS_KEY = '__WEB3FORMS_KEY__';

async function handleNotify(e) {
  e.preventDefault();

  const emailInput = document.getElementById('notify-email');
  const successEl = document.getElementById('form-success');
  const errorEl = document.getElementById('form-error');
  const btn = e.target.querySelector('.btn-submit');
  const email = emailInput.value.trim();

  if (!email) return;

  btn.innerHTML = '<span class="btn-text">Sending…</span>';
  btn.disabled = true;
  if (errorEl) errorEl.classList.remove('show');

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: '🔔 New Launch Notification Request — Rebelote',
        from_name: 'Rebelote Splash Page',
        replyto: email,
        message: `A visitor wants to be notified at launch.\n\nEmail: ${email}\nTime: ${new Date().toLocaleString('fr-TN', { timeZone: 'Africa/Tunis' })}\nPage: ${window.location.href}`,
        botcheck: '',
      }),
    });

    const data = await res.json();

    if (data.success) {
      emailInput.value = '';
      successEl.classList.add('show');
      btn.innerHTML = '<span class="btn-text">✓ You\'re on the list!</span>';
      setTimeout(() => {
        btn.innerHTML = '<span class="btn-text">Notify Me</span><span class="btn-icon">→</span>';
        btn.disabled = false;
        successEl.classList.remove('show');
      }, 4000);
    } else {
      throw new Error(data.message || 'Submission failed');
    }
  } catch (err) {
    console.error('[Rebelote] Form error:', err);
    btn.innerHTML = '<span class="btn-text">Notify Me</span><span class="btn-icon">→</span>';
    btn.disabled = false;
    if (errorEl) errorEl.classList.add('show');
  }
}

/* ===========================
   SMOOTH ANCHOR SCROLLING
=========================== */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ===========================
   CURSOR GLOW EFFECT
=========================== */
const glow = document.createElement('div');
glow.style.cssText = `
  position: fixed;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(229,57,53,0.07) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  transform: translate(-50%, -50%);
  transition: left 0.15s ease, top 0.15s ease;
  will-change: left, top;
`;
document.body.appendChild(glow);

window.addEventListener('mousemove', e => {
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
}, { passive: true });
