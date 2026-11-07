/* ═══ FX Pack — Barber c l'hair ═══ */
(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ═══ V2 ═══
    // Intro (une seule fois par session)
    if (!reduced && !sessionStorage.getItem('fxIntro')) {
        sessionStorage.setItem('fxIntro', '1');
        const intro = document.createElement('div');
        intro.className = 'fx-intro';
        intro.setAttribute('aria-hidden', 'true');
        intro.innerHTML = '<span class="fx-intro-logo">Barber c l\'hair</span><span class="fx-intro-line"></span>';
        document.body.appendChild(intro);
        setTimeout(() => intro.classList.add('fx-out'), 1500);
        setTimeout(() => intro.remove(), 2600);
    }

    // Onde au clic sur les boutons
    document.addEventListener('pointerdown', (e) => {
        const btn = e.target.closest('.btn');
        if (!btn || reduced) return;
        const r = btn.getBoundingClientRect(), s = Math.max(r.width, r.height);
        const rip = document.createElement('span');
        rip.className = 'fx-ripple';
        rip.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
        btn.appendChild(rip);
        setTimeout(() => rip.remove(), 700);
    });

    // Poussière dorée dans le hero
    const hero = document.querySelector('.hero');
    if (hero && !reduced) {
        const cv = document.createElement('canvas');
        cv.className = 'fx-dust';
        cv.setAttribute('aria-hidden', 'true');
        hero.prepend(cv);
        const ctx = cv.getContext('2d');
        const dpr = Math.min(devicePixelRatio || 1, 2);
        let W, H, parts = [], visible = true;
        const color = getComputedStyle(document.documentElement).getPropertyValue('--accent-gold-light').trim() || '#f3d27a';
        const resize = () => {
            W = hero.offsetWidth; H = hero.offsetHeight;
            cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = Math.round(Math.min(70, W / 18));
            parts = Array.from({ length: n }, () => ({
                x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + .4,
                vy: -(Math.random() * .35 + .1), vx: (Math.random() - .5) * .2, a: Math.random() * Math.PI * 2
            }));
        };
        resize(); addEventListener('resize', resize);
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
        ctx.fillStyle = color;
        const loop = () => {
            if (visible) {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = color;
                for (const p of parts) {
                    p.y += p.vy; p.x += p.vx + Math.sin(p.a += .01) * .15;
                    if (p.y < -5) { p.y = H + 5; p.x = Math.random() * W; }
                    ctx.globalAlpha = .25 + Math.sin(p.a * 2) * .2 + .2;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
                }
            }
            requestAnimationFrame(loop);
        };
        loop();
    }



    // 1. Barre de progression de scroll
    const bar = document.createElement('div');
    bar.className = 'fx-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    let ticking = false;
    const updateBar = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
        ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateBar); } }, { passive: true });
    updateBar();

    // 2. Compteurs animés (10+, 5k+ ...)
    const counters = document.querySelectorAll('.stat-num');
    const animateCount = (el) => {
        const m = el.textContent.trim().match(/^(\d+)(k?)(\+?)$/i);
        if (!m || reduced) return;
        const target = +m[1], suffix = m[2] + m[3], dur = 1600, t0 = performance.now();
        const step = (t) => {
            const p = Math.min((t - t0) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => io.observe(c));

    if (reduced || !finePointer) return;




    // 4. Boutons magnétiques
    document.querySelectorAll('.hero-btns .btn, .btn-accent').forEach(btn => {
        btn.addEventListener('pointermove', (e) => {
            const r = btn.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
            btn.style.transform = `translate(${dx * 0.2}px, ${dy * 0.3}px)`;
        });
        btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
})();
