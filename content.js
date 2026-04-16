(() => {
  const LABEL_TEXT = "Show declined events";
  const BUTTON_ID = "gcal-toggle-declined-btn";

  const EYE_OPEN = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;

  const EYE_CLOSED = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>`;

  function waitForElement(predicate, timeout = 3000) {
    return new Promise((resolve, reject) => {
      const existing = predicate();
      if (existing) return resolve(existing);

      const observer = new MutationObserver(() => {
        const el = predicate();
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error("Timed out waiting for element"));
      }, timeout);
    });
  }

  function findSettingsButton() {
    return (
      document.querySelector('button[aria-label="Settings menu"]') ||
      document.querySelector('button[aria-label="Settings"]') ||
      document.querySelector('[data-tooltip="Settings"]') ||
      document.querySelector('a[href*="settings"][aria-label]')
    );
  }

  function findSearchButton() {
    return (
      document.querySelector('button[aria-label="Search"][role="button"]') ||
      document.querySelector('button[aria-label="Search"]') ||
      document.querySelector('[data-tooltip="Search"]')
    );
  }

  async function toggleDeclinedEvents() {
    const settingsButton = findSettingsButton();
    if (!settingsButton) return;

    settingsButton.click();

    try {
      const menuItem = await waitForElement(() => {
        const allElements = document.querySelectorAll(
          '[role="menuitemcheckbox"], [role="menuitem"], li, [data-value]'
        );
        for (const el of allElements) {
          if (el.textContent.trim() === LABEL_TEXT) return el;
        }
        const spans = document.querySelectorAll("span, label, div");
        for (const el of spans) {
          if (
            el.textContent.trim() === LABEL_TEXT &&
            el.childElementCount === 0
          ) {
            return (
              el.closest('[role="menuitemcheckbox"]') ||
              el.closest("li") ||
              el
            );
          }
        }
        return null;
      });

      menuItem.click();
      settingsButton.click();

      const btn = document.getElementById(BUTTON_ID);
      if (btn) {
        const isActive = btn.dataset.active === "true";
        btn.dataset.active = String(!isActive);
        btn.innerHTML = isActive ? EYE_CLOSED : EYE_OPEN;
        updateButtonStyle(btn);
      }
    } catch {
      settingsButton.click();
    }
  }

  function updateButtonStyle(btn) {
    if (btn.dataset.active === "true") {
      btn.style.color = "#1a73e8";
    } else {
      btn.style.color = "#5f6368";
    }
  }

  function createToggleButton() {
    if (document.getElementById(BUTTON_ID)) return;

    // Use the settings gear as anchor — it's always in the visible toolbar
    const settingsButton = findSettingsButton();
    if (!settingsButton) return;

    const btn = document.createElement("button");
    btn.id = BUTTON_ID;
    btn.type = "button";
    btn.dataset.active = "false";
    btn.title = "Toggle declined events";
    btn.setAttribute("aria-label", "Toggle declined events");
    btn.innerHTML = EYE_CLOSED;

    // Use explicit dimensions matching GCal's toolbar icon buttons
    btn.style.cssText = `
      background: none;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      padding: 0;
      width: 48px;
      height: 48px;
      min-width: 48px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #5f6368;
      box-sizing: border-box;
      overflow: visible;
      opacity: 1;
      visibility: visible;
      position: relative;
    `;

    btn.addEventListener("mouseenter", () => {
      btn.style.backgroundColor = "rgba(0,0,0,0.06)";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.backgroundColor = "transparent";
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleDeclinedEvents();
    });

    // Insert right before the settings gear button
    settingsButton.insertAdjacentElement("beforebegin", btn);
  }

  function init() {
    createToggleButton();
    setInterval(() => {
      if (!document.getElementById(BUTTON_ID)) {
        createToggleButton();
      }
    }, 2000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
