const OVERLAY_ID = '__hidex-debug-frame__';

function enableFrame() {
  if (document.getElementById(OVERLAY_ID)) return;

  const frame = document.createElement('div');
  frame.id = OVERLAY_ID;

  Object.assign(frame.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    boxSizing: 'border-box',
    border: '4px solid #00bcd4',
    zIndex: '2147483647',
    pointerEvents: 'none'
  });

  document.documentElement.appendChild(frame);
}

function disableFrame() {
  document.getElementById(OVERLAY_ID)?.remove();
}

function toggleFrame() {
  const exists = !!document.getElementById(OVERLAY_ID);
  exists ? disableFrame() : enableFrame();
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'HIDEX_TOGGLE_DEBUG_MODE') {
    toggleFrame();
    sendResponse({ ok: true });
  }
});
