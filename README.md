# Gmail Orchestrator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Platform-Chrome-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![JavaScript](https://img.shields.io/badge/Language-JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Version](https://img.shields.io/badge/Version-1.1-blue.svg)]()

## :sparkles: Description
Gmail Orchestrator is a Chrome extension that solves a common problem when using external email providers (corporate webmail, etc.) through Gmail. When you configure Gmail to receive and send emails from external accounts for free, Gmail only checks these accounts at long intervals that can range from 5 minutes to 8 hours, making it difficult to effectively use corporate emails in a free environment.

This extension reduces that interval to a single click, allowing you to force immediate checking of new emails without having to manually navigate through Gmail's interface.

## :star: Features
- **:zap: Immediate Verification**: Activates with a single click the verification of external emails.
- **:robot: Automatic Flow**: Opens the settings page, clicks "Check mail now" and closes the tab automatically.
- **:file_cabinet: Smart Tab Management**: Detects and focuses the existing inbox tab or creates a new one if necessary.
- **:repeat: Automatic Reload**: Updates the inbox after checking for new emails.
- **:microscope: Robust UI Verification**: Waits for all Gmail UI components to be fully loaded before taking actions.
- **:inbox_tray: Background Operation**: Performs the entire process without interrupting your workflow.

## :rocket: How it works
1. When you click on the extension icon, it:
   - Detects if a Gmail tab is open for the specific account
   - If it exists, focuses it; if not, opens a new tab
   - Opens the Gmail settings page in the background
   - Waits for the page to be fully loaded
   - Clicks the "Check mail now" button
   - Waits for the action to be complete
   - Closes the settings tab
   - Reloads the inbox to show new emails

## :computer: Main Functions
- `waitForTabLoad`: Waits for a tab to be fully loaded
- `verifyUIComponents`: Verifies that all Gmail UI components are loaded
- `clickCheckMailButton`: Finds and clicks the "Check mail now" button
- `observeCheckMailConfirmation`: Observes the visual confirmation of the click
- `refreshInboxAlternative`: Alternative methods to update the inbox
- `clickRefreshButton`: Clicks the refresh button in the inbox

## :globe_with_meridians: Technologies
- :coffee: JavaScript
- :electric_plug: Chrome API (tabs, scripting)

## :hammer_and_wrench: Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the folder of this project

## :point_right: Usage
1. Click on the extension icon when you want to check for new emails in your external accounts configured in Gmail
2. The extension will take care of the entire process automatically
3. You will see new emails in your inbox after a few seconds

## :brain: Acknowledgments

_"Whoever loves discipline loves knowledge, but whoever hates correction is stupid."_