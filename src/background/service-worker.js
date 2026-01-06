chrome.runtime.onInstalled.addListener(() => console.log('HideX installed or updated'));

chrome.commands.onCommand.addListener(async (command) => {

  if (command !== 'toggle-mode') return;

  const [ tab ] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  try {

    await chrome.tabs.sendMessage(tab.id, { type: 'HIDEX_TOGGLE_DEBUG_MODE' });
  } catch (e) {
    console.error('HideX: cannot reach content script in this tab', e);
  }
})
