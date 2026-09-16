(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.body.classList.add("reveal-ready");
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------
     Sticky nav state
     --------------------------------------------------------------------- */
  var nav = document.getElementById("nav");
  function onScrollNav() {
    if (window.scrollY > 12) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---------------------------------------------------------------------
     Mobile menu
     --------------------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");

  function closeMenu(returnFocus) {
    mobileMenu.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Abrir menú");
    document.body.style.overflow = "";
    if (returnFocus) navToggle.focus();
  }
  function openMenu() {
    mobileMenu.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Cerrar menú");
    document.body.style.overflow = "hidden";
  }
  navToggle.addEventListener("click", function () {
    var expanded = navToggle.getAttribute("aria-expanded") === "true";
    if (expanded) closeMenu(false); else openMenu();
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-menu-link]"), function (link) {
    link.addEventListener("click", function () { closeMenu(false); });
  });
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) closeMenu(true);
  });

  /* ---------------------------------------------------------------------
     Scroll reveal (IntersectionObserver, GSAP-assisted stagger)
     --------------------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------------
     GSAP: hero entrance + subtle parallax + temperature chart draw
     --------------------------------------------------------------------- */
  if (window.gsap) {
    gsap.registerPlugin(window.ScrollTrigger);

    if (!prefersReduced) {
      gsap.from(".hero-content > *", {
        y: 24,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: "power3.out",
        delay: 0.15
      });

      gsap.to(".hero-scene", {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 0.6
        }
      });
    }

    var chartLine = document.getElementById("chartLine");
    if (chartLine) {
      if (prefersReduced) {
        chartLine.style.strokeDasharray = "none";
      } else {
        gsap.set(chartLine, { strokeDasharray: 1000, strokeDashoffset: 1000 });
        gsap.to(chartLine, {
          strokeDashoffset: 0,
          duration: 1.8,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: "#tempChart",
            start: "top 80%",
            once: true
          }
        });
        gsap.from(".chart-event", {
          opacity: 0,
          scale: 0.4,
          duration: 0.5,
          stagger: 0.25,
          delay: 1.4,
          ease: "back.out(2)",
          scrollTrigger: {
            trigger: "#tempChart",
            start: "top 80%",
            once: true
          }
        });
        gsap.from(".chart-area", {
          opacity: 0,
          duration: 1.6,
          scrollTrigger: {
            trigger: "#tempChart",
            start: "top 80%",
            once: true
          }
        });
      }
    }
  }

  /* ---------------------------------------------------------------------
     Selector -> smooth-scroll to matching product
     --------------------------------------------------------------------- */
  var selectorButtons = document.querySelectorAll(".selector-option");
  var productCards = document.querySelectorAll(".product-card");

  selectorButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-target");
      var card = document.querySelector(".product-card." + target);
      if (!card) return;

      document.getElementById("productos").scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });

      productCards.forEach(function (c) { c.style.outline = "none"; });
      window.setTimeout(function () {
        card.style.transition = "outline-color 240ms ease";
        card.style.outline = "2px solid var(--pc)";
        card.style.outlineOffset = "4px";
        window.setTimeout(function () { card.style.outline = "none"; }, 2200);
      }, prefersReduced ? 0 : 500);

      setWaProduct(target);
    });
  });

  /* ---------------------------------------------------------------------
     WhatsApp quote form — product pills sync with the selector and the
     product-card CTAs, then compose a pre-filled wa.me message on submit
     --------------------------------------------------------------------- */
  var WA_NUMBER = "56978658387";
  var WA_PRODUCT_NAMES = { essential: "Essential", professional: "Professional", live: "Live" };
  var waProductButtons = document.querySelectorAll(".wa-product-option");
  var waForm = document.getElementById("waForm");
  var selectedWaProduct = null;

  function setWaProduct(key) {
    if (!WA_PRODUCT_NAMES[key]) return;
    selectedWaProduct = key;
    waProductButtons.forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-product") === key));
    });
  }

  waProductButtons.forEach(function (b) {
    b.addEventListener("click", function () {
      var key = b.getAttribute("data-product");
      setWaProduct(selectedWaProduct === key ? null : key);
      if (selectedWaProduct === null) b.setAttribute("aria-pressed", "false");
    });
  });

  document.querySelectorAll(".product-cta[data-product]").forEach(function (link) {
    link.addEventListener("click", function () {
      setWaProduct(link.getAttribute("data-product"));
    });
  });

  if (waForm) {
    waForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("waName").value.trim();
      var company = document.getElementById("waCompany").value.trim();

      var greeting = "Hola, soy " + name + (company ? " de la empresa " + company : "") + ".";
      var body = selectedWaProduct
        ? " Estoy interesado/a en FrigoTrack " + WA_PRODUCT_NAMES[selectedWaProduct] + " y quisiera más información."
        : " Quisiera más información sobre las soluciones FrigoTrack.";

      var message = encodeURIComponent(greeting + body);
      window.open("https://wa.me/" + WA_NUMBER + "?text=" + message, "_blank", "noopener");
    });
  }

  /* ---------------------------------------------------------------------
     Cursor glow — subtle neon trail, mouse-driven devices only
     --------------------------------------------------------------------- */
  var glow = document.getElementById("cursorGlow");
  var hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (glow && hasFinePointer && !prefersReduced) {
    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var currentX = targetX;
    var currentY = targetY;
    var rafId = null;

    function renderGlow() {
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      glow.style.transform = "translate3d(" + currentX + "px, " + currentY + "px, 0)";
      rafId = window.requestAnimationFrame(renderGlow);
    }

    window.addEventListener("mousemove", function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      glow.classList.add("is-active");
    }, { passive: true });

    document.addEventListener("mouseleave", function () {
      glow.classList.remove("is-active");
    });

    rafId = window.requestAnimationFrame(renderGlow);
  }
})();
