document.getElementById('toggleMode').addEventListener('click', toggleMode);

async function toggleMode() {

  const tabId = await getActiveTabId();
  if (!tabId) return;

  try {

    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'HIDEX_TOGGLE_DEBUG_MODE'
    });

    console.log('Response: ', response);
  } catch (e) {
    console.error(e);
  }
}

async function getActiveTabId() {

  const [ tab ] = await chrome.tabs.query({ active: true, currentWindow: true })

  return tab?.id;
}

