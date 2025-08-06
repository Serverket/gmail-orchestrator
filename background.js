// Register extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Gmail Orchestrator installed.");
});

// Handle extension icon click
chrome.action.onClicked.addListener(async () => {
  try {
    console.log("===== Starting Gmail Orchestrator workflow =====");
    
    // STEP 1: Detect if inbox tab is already open
    console.log("Looking for existing inbox tab...");
    let inboxTab = null;
    let accountIndex = null; // Store the detected account index
    
    // Query all open tabs
    const allTabs = await chrome.tabs.query({});
    console.log(`Total tabs found: ${allTabs.length}`);
    
    // Check each tab for Gmail inbox
    for (const tab of allTabs) {
      if (tab.url && tab.url.includes("mail.google.com/mail")) {
        console.log(`Gmail tab found: ${tab.url} (ID: ${tab.id})`);
        
        // Extract account index if present
        const indexMatch = tab.url.match(/mail\.google\.com\/mail\/u\/(\d+)/);
        const currentIndex = indexMatch ? `u/${indexMatch[1]}` : "";
        
        // Full verification for inbox
        if (!tab.url.includes('#settings') && 
            (tab.url.includes('#inbox') || 
             tab.url.match(/https:\/\/mail\.google\.com\/mail(\/u\/\d+)?\//) || 
             tab.url.match(/https:\/\/mail\.google\.com\/mail(\/u\/\d+)?$/) ||
             !tab.url.includes('#'))) {
          console.log(`✅ INBOX FOUND: ${tab.url} (ID: ${tab.id})`);
          inboxTab = tab;
          accountIndex = currentIndex;
          console.log(`Detected account index: ${accountIndex || "default (primary)"}`);
          break;
        }
      }
    }
    
    // STEP 2: Focus on inbox tab or open new one if not found
    if (!inboxTab) {
      console.log("No inbox tab found. Opening new one with default account...");
      inboxTab = await chrome.tabs.create({ url: "https://mail.google.com/mail/#inbox", active: true });
      // Wait for a moment for it to load
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log(`Inbox already open. Focusing on tab: ${inboxTab.id}`);
      await chrome.tabs.update(inboxTab.id, { active: true });
    }
    
    // STEP 3: Open settings tab in background using same account
    console.log(`Opening settings tab in background for account ${accountIndex || "default (primary)"}...`);
    const settingsUrl = `https://mail.google.com/mail/${accountIndex ? accountIndex + '/' : ''}#settings/accounts`;
    console.log(`Settings URL: ${settingsUrl}`);
    const settingsTab = await chrome.tabs.create({ url: settingsUrl, active: false });
    
    // STEP 4: Wait for settings tab to load completely
    console.log(`Waiting for settings tab to load: ${settingsTab.id}`);
    await waitForTabLoad(settingsTab.id);
    
    // Verify that all UI components are fully loaded
    console.log("Verifying that all UI components are fully loaded...");
    await verifyUIComponents(settingsTab.id);
    
    // STEP 5: Execute click on Check mail now
    console.log("Executing click on 'Check mail now'...");
    let clickSuccess = false;
    
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: settingsTab.id },
        function: clickCheckMailButton
      });
      
      clickSuccess = results && results[0] && results[0].result === "SUCCESS";
      console.log(`Click result: ${clickSuccess ? "Success" : "Failure"}`);
      
      // If click was successful, wait enough time for action to complete
      if (clickSuccess) {
        console.log("Waiting 7 seconds for action to complete...");
        
        // Check for visual confirmation of click
        await chrome.scripting.executeScript({
          target: { tabId: settingsTab.id },
          function: observeCheckMailConfirmation
        });
        
        // Wait enough time for action to complete (7 seconds)
        console.log("Waiting 7 seconds for action to complete...");
        await new Promise(resolve => setTimeout(resolve, 7000));
        console.log("Wait complete, proceeding to close tab.");
      } else {
        // If click failed, still wait a bit before closing
        console.log("Click failed. Waiting 2 seconds before closing...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("Error executing click script:", error);
    }
    
    // STEP 6: Close settings tab
    console.log(`Closing settings tab: ${settingsTab.id}...`);
    try {
      await chrome.tabs.remove(settingsTab.id);
    } catch (error) {
      console.error("Error closing settings tab:", error);
    }
    
    // STEP 7: Reload inbox tab directly
    console.log("Reloading inbox tab...");
    try {
      // Give browser time to switch focus to inbox tab
      console.log("Waiting 1 second before reloading tab...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ensure inbox tab is active
      await chrome.tabs.update(inboxTab.id, { active: true });
      
      // Reload tab directly
      console.log(`Reloading tab ${inboxTab.id}...`);
      await chrome.tabs.reload(inboxTab.id);
      console.log("Tab reloaded successfully.");
    } catch (error) {
      console.error("Error reloading inbox tab:", error);
    }
    
    // At this point, user is already on inbox tab and it has been updated
    // and settings tab is closed
    
    console.log("===== Gmail Orchestrator workflow complete =====");
  } catch (error) {
    console.error("Error during execution:", error);
  }
});

// Function to verify that all UI components are fully loaded
async function verifyUIComponents(tabId) {
  console.log(`Verifying UI components in tab ${tabId}...`);
  
  // First check: Ensure DOM is fully loaded
  let checkComplete = false;
  let attempts = 0;
  const maxAttempts = 10; // Maximum attempts
  
  while (!checkComplete && attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts} to verify UI components...`);
    
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        function: () => {
          // Verify critical elements of settings page
          const settingsContainer = document.querySelector('.aeV, .aWh, .aeJ, .ae4');
          const accountsSection = document.querySelector('[role="main"], [role="tabpanel"], .ae4, .Cp');
          const loadingIndicator = document.querySelector('.aAm, .aDm, .La-vL');
          
          // If loading indicator is visible, we're not ready
          if (loadingIndicator && window.getComputedStyle(loadingIndicator).display !== 'none') {
            console.log("Loading indicator still visible, waiting...");
            return false;
          }
          
          // Verify settings page elements exist
          if (!settingsContainer || !accountsSection) {
            console.log("Settings containers not available yet");
            return false;
          }
          
          // Verify interactive elements (buttons, links, etc.)
          const interactiveElements = document.querySelectorAll('button, [role="button"], a, input, [tabindex="0"]');
          if (interactiveElements.length < 10) { // Should be several interactive elements
            console.log("Insufficient interactive elements loaded");
            return false;
          }

          // Specifically look for Check mail now button or related elements
          const checkMailElements = Array.from(document.querySelectorAll('span, button')).filter(el => {
            return el.textContent && el.textContent.includes('Check mail');
          });
          
          if (checkMailElements.length === 0) {
            console.log("No 'Check mail now' button found");
            return false;
          }
          
          console.log("All UI components are loaded correctly");
          return true;
        }
      });
      
      checkComplete = results && results[0] && results[0].result === true;
      
      if (checkComplete) {
        console.log("UI component verification successful!");
        break;
      } else {
        console.log("UI components not fully loaded yet, waiting...");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
      }
    } catch (error) {
      console.error("Error verifying UI components:", error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  if (!checkComplete) {
    console.log("Failed to complete UI component verification after several attempts.");
  }
  
  // Always wait additional time to ensure page stability
  console.log("Waiting 2 seconds for page stability...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  return checkComplete;
}

// Function to wait for tab to load completely
async function waitForTabLoad(tabId) {
  return new Promise((resolve) => {
    function listener(updatedTabId, changeInfo, tab) {
      // Check if it's the tab we're waiting for and if it's finished loading
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(tab);
      }
    }
    
    chrome.tabs.onUpdated.addListener(listener);
    
    // Also add a timeout to avoid waiting indefinitely
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(null); // Resolve with null after timeout
    }, 10000); // 10 seconds timeout
  });
}

// Function to observe visual confirmation after clicking Check mail now
function observeCheckMailConfirmation() {
  console.log("Observing visual confirmation of 'Check mail now' click...");
  
  // This function looks for visual confirmations that the click had an effect
  // such as a confirmation message, a loading indicator, etc.
  
  // Check for confirmation messages
  const confirmationElements = document.querySelectorAll('.UI5muqDOjVnqjsDq0miz, .bAq');
  if (confirmationElements.length > 0) {
    console.log("Visual confirmation found.");
  } else {
    console.log("No specific visual confirmation found.");
  }
  
  // This function doesn't return anything, just logs information
  return "OBSERVED";
}

// Function to be executed in page context to click Check mail now button
function clickCheckMailButton() {
  console.log("Looking for 'Check mail now' button in page...");
  
  // Strategy 1: By aria-label attribute
  let checkMailButton = document.querySelector("button[aria-label='Check mail now']");
  console.log("Strategy 1 (aria-label):", checkMailButton ? "Button found" : "Button not found");
  
  // Strategy 2: By span text
  if (!checkMailButton) {
    const spans = Array.from(document.querySelectorAll('span'));
    console.log(`Looking in ${spans.length} spans...`);
    
    const targetSpan = spans.find(span => span.textContent === 'Check mail now');
    
    if (targetSpan) {
      console.log("Span 'Check mail now' found");
      
      // Get parent button if exists
      if (targetSpan.closest('button')) {
        checkMailButton = targetSpan.closest('button');
        console.log("Strategy 2 (span + parent button): Button found");
      } else if (targetSpan.id === ':301') {
        // If it's the specific span with id=":301"
        checkMailButton = targetSpan;
        console.log("Strategy 2 (span with specific ID): Button found");
      }
    } else {
      console.log("No span with text 'Check mail now' found");
    }
  }
  
  // Strategy 3: By partial text in any clickable element
  if (!checkMailButton) {
    const clickables = Array.from(document.querySelectorAll('button, a, [role="button"], [tabindex="0"]'));
    console.log(`Looking in ${clickables.length} clickable elements...`);
    
    const target = clickables.find(el => {
      const text = el.textContent || '';
      return text.includes('Check mail') || text.includes('check mail');
    });
    
    if (target) {
      checkMailButton = target;
      console.log("Strategy 3 (partial text in clickable element): Button found");
    } else {
      console.log("No clickable element with similar text found");
    }
  }
  
  // Click if button is found
  if (checkMailButton) {
    console.log("Check mail now button found, clicking...");
    checkMailButton.click();
    return "SUCCESS";
  } else {
    console.log("FAILED: Could not find 'Check mail now' button");
    return "ERROR";
  }
}

// Alternative function to update inbox using keyboard shortcuts or direct reload
function refreshInboxAlternative() {
  console.log("Trying alternative method to update inbox...");
  
  try {
    // Method 1: Try simulating keyboard shortcut U (Gmail's shortcut to update)
    const mailView = document.querySelector('.aAy');
    if (mailView) {
      console.log("Sending keyboard event 'u' to mail panel...");
      const event = new KeyboardEvent('keydown', {
        key: 'u',
        code: 'KeyU',
        keyCode: 85,
        which: 85,
        bubbles: true,
        cancelable: true
      });
      mailView.dispatchEvent(event);
      return "SUCCESS";
    }
    
    // Method 2: Try using history API
    console.log("Trying to reload using history.go(0)...");
    window.history.go(0);
    return "SUCCESS";
  } catch (e) {
    console.error("Error in refreshInboxAlternative:", e);
    return "ERROR";
  }
}

// Function to click refresh button in inbox
function clickRefreshButton() {
  console.log("Looking for refresh button in inbox...");
  
  // Strategy 1: By direct selector as per example provided
  let refreshButton = document.querySelector('.T-I.J-J5-Ji.nu.T-I-ax7.L3[data-tooltip="Refresh"], .T-I.J-J5-Ji.nu.T-I-ax7.L3[aria-label="Refresh"]');
  console.log("Strategy 1 (direct selector):", refreshButton ? "Button found" : "Button not found");
  
  // Strategy 2: By aria-label or data-tooltip attribute
  if (!refreshButton) {
    refreshButton = document.querySelector('[aria-label="Refresh"], [data-tooltip="Refresh"]');
    console.log("Strategy 2 (attributes):", refreshButton ? "Button found" : "Button not found");
  }
  
  // Strategy 3: By role and attributes
  if (!refreshButton) {
    const buttons = Array.from(document.querySelectorAll('[role="button"]'));
    console.log(`Looking in ${buttons.length} elements with role="button"...`);
    
    refreshButton = buttons.find(button => {
      // Look for tooltip or aria-label
      if (button.getAttribute('data-tooltip') === 'Refresh' || button.getAttribute('aria-label') === 'Refresh') {
        return true;
      }
      // Look for class
      if (button.classList.contains('T-I-ax7') && button.classList.contains('nu')) {
        return true;
      }
      // Look for jslog
      if (button.getAttribute('jslog') && button.getAttribute('jslog').includes('110081')) {
        return true;
      }
      return false;
    });
    
    console.log("Strategy 3 (combined attributes):", refreshButton ? "Button found" : "Button not found");
  }
  
  // Strategy 4: Look in structure as in example
  if (!refreshButton) {
    const containers = document.querySelectorAll('.G-Ni.J-J5-Ji');
    console.log(`Looking in ${containers.length} potential containers...`);
    
    for (const container of containers) {
      const potential = container.querySelector('.T-I.J-J5-Ji.nu.T-I-ax7.L3');
      if (potential) {
        refreshButton = potential;
        console.log("Strategy 4 (HTML structure): Button found");
        break;
      }
    }
  }
  
  // Click if button is found
  if (refreshButton) {
    console.log("Refresh button found, clicking...");
    refreshButton.click();
    return "SUCCESS";
  } else {
    console.log("FAILED: Could not find refresh button");
    return "ERROR";
  }
}
