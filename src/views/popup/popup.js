let active = false;

document.getElementById('toggleMode').addEventListener('click', toggleMode);

document.addEventListener('DOMContentLoaded', async () => {

  const { hidex_last_snapshot } = await chrome.storage.local.get('hidex_data');

  if (hidex_last_snapshot) renderBaked(hidex_last_snapshot);

});

async function toggleMode() {

  const tabId = await getActiveTabId();
  if (!tabId) return;

  active = !active;

  try {

    await chrome.tabs.sendMessage(tabId, {
      type: active ? 'HIDEX_ENTER_SELECT_MODE' : 'HIDEX_EXIT_SELECT_MODE'
    });

  } catch (e) {
    console.error(e);
  }
}

async function getActiveTabId() {

  const [ tab ] = await chrome.tabs.query({ active: true, currentWindow: true })

  return tab?.id;
}

function renderBaked(snapshot) {

  const container = document.getElementById('preview');
  if (!container) return;

  container.innerHTML = snapshot.html;
  const node = container.firstElementChild;
  if (!node) return;

  node.style.cssText += ';' + snapshot.cssText;
  node.style.maxWidth = '100%';
  node.style.maxHeight = '180px';
  node.style.overflow = 'hidden';
}

