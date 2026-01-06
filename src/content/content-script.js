let selectMode = false;
const OVERLAY_ID = '__hidex-select-frame__';

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

function buildSelector(element) {

  if (element.id) return `#${ CSS.escape(element.id) }`;

  const classList = Array.from(element.classList || []).filter(Boolean);
  if (classList.length) {
    return `${ element.tagName.toLowerCase() }.${ classList.map(c => CSS.escape(c)).join('.') }`;
  }

  return element.tagName.toLowerCase();
}

function buildElementData(element) {

  return {
    tag: element.tagName.toLowerCase(),
    id: element.id || null,
    classes: Array.from(element.classList || []),
    text: (element.innerText || '').trim().slice(0, 100) || null,
    selector: buildSelector(element),
    dom: bakeElement(element)
  };
}

function computedCssText(el) {

  const computedStyle = getComputedStyle(el);
  let css = '';

  for (const prop of computedStyle) {
    css += `${ prop }:${ computedStyle.getPropertyValue(prop) };`;
  }

  return css;
}

function bakeElement(el) {

  return {
    html: el.outerHTML,
    cssText: computedCssText(el),
    meta: {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      classes: Array.from(el.classList || []),
      createdAt: Date.now(),
      url: location.href
    }
  };
}

function onClickCapture(e) {
  if (!selectMode) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const element = document.elementFromPoint(e.clientX, e.clientY);
  if (!element) return;

  if (element.id && element.id.startsWith('__hidex-')) return;

  const data = buildElementData(element);
  console.log('HideX picked element:', data);

  chrome.storage.local.set({ hidex_last_snapshot: data.dom }).then();

  disableSelectMode();
}

function enableSelectMode() {
  if (selectMode) return { ok: true, already: true };

  selectMode = true;
  enableFrame();
  document.addEventListener('click', onClickCapture, true);

  return { ok: true, active: true };
}

function disableSelectMode() {
  if (!selectMode) return { ok: true, already: true };

  selectMode = false;
  disableFrame();
  document.removeEventListener('click', onClickCapture, true);

  return { ok: true, active: false };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (!message?.type) return;

  if (message.type === 'HIDEX_ENTER_SELECT_MODE') {
    sendResponse(enableSelectMode());
    return true;
  }

  if (message.type === 'HIDEX_EXIT_SELECT_MODE') {
    sendResponse(disableSelectMode());
    return true;
  }
});
