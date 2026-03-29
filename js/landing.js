/* =========================================================
   ИНТЕРАКТИВ ГЛАВНОЙ СТРАНИЦЫ
   1) Короткий FAQ-аккордеон
   2) Кнопка быстрого перехода к разделу продуктов
   3) Авто-подстановка текущего года в подвал
   ========================================================= */
(function () {
  function initializeScrollButton() {
    var button = document.querySelector("[data-scroll-to-products]");
    var target = document.getElementById("products");

    if (!button || !target) {
      return;
    }

    button.addEventListener("click", function () {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function initializeFaqAccordion() {
    var root = document.querySelector("[data-faq-root]");

    if (!root) {
      return;
    }

    var triggers = root.querySelectorAll("[data-faq-trigger]");

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var item = trigger.closest(".faq-item");
        var content = item ? item.querySelector("[data-faq-content]") : null;
        var isExpanded = trigger.getAttribute("aria-expanded") === "true";

        if (!content) {
          return;
        }

        trigger.setAttribute("aria-expanded", String(!isExpanded));
        content.hidden = isExpanded;
      });
    });
  }

  function initializeCurrentYear() {
    var yearNodes = document.querySelectorAll("[data-current-year]");
    if (!yearNodes.length) {
      return;
    }

    var year = String(new Date().getFullYear());
    yearNodes.forEach(function (node) {
      node.textContent = year;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initializeScrollButton();
    initializeFaqAccordion();
    initializeCurrentYear();
  });
})();
