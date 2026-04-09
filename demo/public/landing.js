(function () {
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length || !("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("visible");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.08 }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  function initMermaid() {
    if (typeof mermaid === "undefined") return;
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      themeVariables: {
        primaryColor: "#1a2332",
        primaryTextColor: "#e7ecf3",
        primaryBorderColor: "#2d3a4d",
        lineColor: "#22d3ee",
        secondaryColor: "#12121a",
        tertiaryColor: "#0a0a0f",
      },
    });
    var p = mermaid.run({ querySelector: ".mermaid" });
    if (p && typeof p.catch === "function") p.catch(function () {});
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initMermaid();
  });
})();
