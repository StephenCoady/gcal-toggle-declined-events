chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || !tab.url.includes("calendar.google.com")) {
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: toggleDeclinedEvents,
    });
  } catch (err) {
    console.error("Failed to toggle declined events:", err);
  }
});

async function toggleDeclinedEvents() {
  const LABEL_TEXT = "Show declined events";

  // Utility: wait for an element matching a predicate to appear in the DOM
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

  // Step 1: Find and click the settings gear button.
  // Try multiple selectors since Google may change aria-labels across deploys.
  const settingsButton =
    document.querySelector('button[aria-label="Settings menu"]') ||
    document.querySelector('button[aria-label="Settings"]') ||
    document.querySelector('[data-tooltip="Settings"]') ||
    document.querySelector('a[href*="settings"][aria-label]');
  if (!settingsButton) {
    alert("GCal Toggle: Could not find the settings gear button.");
    return;
  }
  settingsButton.click();

  // Step 2: Wait for the dropdown menu to render, then find "Show declined events"
  try {
    const menuItem = await waitForElement(() => {
      // Search all elements for text content matching the label
      const allElements = document.querySelectorAll(
        '[role="menuitemcheckbox"], [role="menuitem"], li, [data-value]'
      );
      for (const el of allElements) {
        if (el.textContent.trim() === LABEL_TEXT) {
          return el;
        }
      }
      // Broader fallback: any clickable element with the label text
      const spans = document.querySelectorAll("span, label, div");
      for (const el of spans) {
        if (
          el.textContent.trim() === LABEL_TEXT &&
          el.childElementCount === 0
        ) {
          return el.closest('[role="menuitemcheckbox"]') || el.closest("li") || el;
        }
      }
      return null;
    });

    menuItem.click();

    // Step 3: Close the settings menu by clicking the gear button again
    settingsButton.click();
  } catch {
    // Close the menu if we opened it but couldn't find the option
    settingsButton.click();
    alert(
      'GCal Toggle: Could not find "Show declined events" in the settings menu.'
    );
  }
}
