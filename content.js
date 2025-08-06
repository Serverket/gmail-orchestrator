// This script executes automatically when loading any Gmail page
// It doesn't automatically navigate to settings because that's now handled by background.js

console.log("Gmail Orchestrator content script loaded");

// Helper function to find and click the "Check mail now" button if we're on the correct page
function tryClickCheckMailButton() {
  // Only execute this function if we're on the accounts settings page
  if (window.location.hash.includes('#settings/accounts')) {
    console.log("Accounts settings page detected, looking for the button...");
    
    // Try to find the button using various strategies
    let checkMailButton = document.querySelector("button[aria-label='Check mail now']");
    
    // If we don't find it by aria-label, we look for a span with the text
    if (!checkMailButton) {
      const spans = Array.from(document.querySelectorAll('span'));
      const targetSpan = spans.find(span => span.textContent === 'Check mail now');
      
      if (targetSpan) {
        if (targetSpan.closest('button')) {
          checkMailButton = targetSpan.closest('button');
        } else if (targetSpan.className.includes('rP sA')) {
          // If it's the specific span with the id or class mentioned in the requirements
          checkMailButton = targetSpan;
        }
      }
    }
    
    if (checkMailButton) {
      checkMailButton.click();
      console.log("✅ Content script: Clicked on 'Check mail now'.");
      // We no longer handle redirection here, it's managed from background.js
    }
  }
}

// Mutation observer to detect changes in the DOM
const observer = new MutationObserver((mutations) => {
  // If we're on the settings page, we check if the button is already available
  if (window.location.hash && window.location.hash.includes('#settings/accounts')) {
    tryClickCheckMailButton();
  }
});

// Set up the observer to monitor changes in the DOM
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Also try when the page loads
if (document.readyState === "complete") {
  tryClickCheckMailButton();
} else {
  window.addEventListener("load", () => {
    tryClickCheckMailButton();
  });
}
