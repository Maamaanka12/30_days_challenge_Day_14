/* ============================================================
   LARKSPUR PHARMACY — interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- shared helpers ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const arrowIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function toast(message) {
    let stack = $(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = '<span class="tick">✓</span><span></span>';
    el.lastElementChild.textContent = message;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));
    setTimeout(() => {
      el.classList.remove("is-visible");
      setTimeout(() => el.remove(), 600);
    }, 3200);
  }

  /* ---------- header: shadow state on scroll ---------- */
  const header = $("#siteHeader");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  const toggle = $("#menuToggle");
  const overlay = $("#menuOverlay");
  if (toggle && overlay) {
    const setMenu = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      overlay.classList.toggle("is-open", open);
      overlay.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("menu-open", open);
    };
    toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
    $$("a", overlay).forEach(link => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  }

  /* ---------- active nav links ---------- */
  const page = document.body.dataset.page || "";
  if (page) {
    $$('[data-nav]').forEach(link => {
      if (link.dataset.nav === page) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /* ---------- scroll reveal ---------- */
  const reveals = $$(".reveal");
  if (reveals.length) {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      reveals.forEach((el, i) => {
        el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + "ms";
        io.observe(el);
      });
    } else {
      reveals.forEach(el => el.classList.add("is-visible"));
    }
  }

  /* ---------- shopping bag (catalog pages) ---------- */
  const bagCount = $("#bagCount");
  let bag = 0;
  try { bag = parseInt(localStorage.getItem("larkspur-bag") || "0", 10) || 0; } catch (e) { bag = 0; }
  const renderBag = () => {
    if (!bagCount) return;
    bagCount.textContent = bag > 99 ? "99+" : String(bag);
    bagCount.classList.toggle("has-items", bag > 0);
    const btn = $("#bagButton");
    if (btn) btn.setAttribute("aria-label", "Shopping bag, " + bag + " " + (bag === 1 ? "item" : "items"));
  };
  renderBag();
  $$(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      bag += 1;
      try { localStorage.setItem("larkspur-bag", String(bag)); } catch (e) { /* storage blocked */ }
      renderBag();
      const name = btn.closest(".product-card")?.querySelector("h3")?.textContent || "Item";
      toast(name + " added to your bag");
    });
  });
  const bagButton = $("#bagButton");
  if (bagButton) bagButton.addEventListener("click", () => toast(bag ? "Your bag has " + bag + " " + (bag === 1 ? "item" : "items") : "Your bag is empty"));

  /* ---------- catalog: filters + search ---------- */
  const products = $$(".product-card[data-category]");
  if (products.length) {
    const filterBtns = $$(".filter-btn");
    const search = $("#productSearch");
    const empty = $(".empty-state");
    let active = "All";

    const apply = () => {
      const term = (search?.value || "").trim().toLowerCase();
      let shown = 0;
      products.forEach(card => {
        const matchCat = active === "All" || card.dataset.category === active;
        const matchText = !term || card.dataset.name.toLowerCase().includes(term) ||
                          card.textContent.toLowerCase().includes(term);
        const show = matchCat && matchText;
        card.classList.toggle("is-hidden", !show);
        if (show) shown++;
      });
      if (empty) empty.classList.toggle("is-hidden", shown !== 0);
    };

    filterBtns.forEach(btn => btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      active = btn.dataset.filter;
      apply();
    }));
    search?.addEventListener("input", apply);
  }

  /* ---------- contact form validation ---------- */
  const form = $("#contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$("[data-validate]", form).forEach(input => {
        const field = input.closest(".field");
        const value = input.value.trim();
        let valid = value.length > 0;
        if (valid && input.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (valid && input.dataset.validate === "long") valid = value.length >= 12;
        field.classList.toggle("has-error", !valid);
        input.setAttribute("aria-invalid", String(!valid));
        if (!valid) ok = false;
      });
      if (!ok) {
        toast("Please check the highlighted fields");
        return;
      }
      form.reset();
      toast("Message sent — we'll be in touch shortly");
    });
    $$("[data-validate]", form).forEach(input => {
      input.addEventListener("input", () => input.closest(".field").classList.remove("has-error"));
    });
  }

  /* ---------- FAQ accordion ---------- */
  $$(".faq-q").forEach(q => {
    q.addEventListener("click", () => {
      const item = q.closest(".faq-item");
      const answer = $(".faq-a", item);
      const open = item.classList.contains("is-open");
      $$(".faq-item").forEach(other => {
        other.classList.remove("is-open");
        $(".faq-a", other).style.maxHeight = null;
      });
      if (!open) {
        item.classList.add("is-open");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

  /* ---------- newsletter forms (footer) ---------- */
  $$(".footer-form").forEach(f => {
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("input", f);
      if (!input.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
        toast("Enter a valid email address");
        return;
      }
      input.value = "";
      toast("You're on the list. Watch your inbox.");
    });
  });
})();
