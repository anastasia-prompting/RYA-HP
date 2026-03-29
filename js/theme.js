/* =========================================================
   ОБЩАЯ ЛОГИКА ТЕМЫ
   1) Раннее применение темы до рендера страницы
   2) Инициализация кнопки переключения после загрузки DOM
   ========================================================= */
(function () {
  var storageKey = "theme";
  var root = document.documentElement;
  var mediaQuery =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");

  function getStoredTheme() {
    try {
      return window.localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function persistTheme(theme) {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (error) {
      /* Если localStorage недоступен, просто пропускаем сохранение. */
    }
  }

  function getPreferredTheme() {
    return mediaQuery && mediaQuery.matches ? "dark" : "light";
  }

  function getActiveTheme() {
    return getStoredTheme() || getPreferredTheme();
  }

  function applyTheme(theme, persist) {
    root.dataset.theme = theme;

    if (persist) {
      persistTheme(theme);
    }
  }

  function updateToggleState(button) {
    if (!button) {
      return;
    }

    var label = button.querySelector("[data-theme-toggle-label]");
    var hint = button.querySelector("[data-theme-toggle-hint]");
    var isDark = root.dataset.theme === "dark";

    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute(
      "aria-label",
      isDark ? "Переключить на светлую тему" : "Переключить на тёмную тему"
    );

    if (label) {
      label.textContent = isDark ? "Светлая" : "Тёмная";
    }

    if (hint) {
      hint.textContent = "тема";
    }
  }

  /* Применяем тему как можно раньше, чтобы уменьшить визуальное мигание. */
  applyTheme(getActiveTheme(), false);

  document.addEventListener("DOMContentLoaded", function () {
    var toggleButton = document.querySelector("[data-theme-toggle]");

    updateToggleState(toggleButton);

    if (!toggleButton) {
      return;
    }

    toggleButton.addEventListener("click", function () {
      var nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
      updateToggleState(toggleButton);
    });

    if (mediaQuery && typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", function () {
        if (!getStoredTheme()) {
          applyTheme(getPreferredTheme(), false);
          updateToggleState(toggleButton);
        }
      });
    }
  });
})();
