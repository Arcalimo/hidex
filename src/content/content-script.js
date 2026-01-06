let selectMode = false;
const OVERLAY_ID = '__hidex-select-frame__';

const STORE_KEY = 'hidex_data';

function getHost() {
  return location.hostname;
}

function newId() {
  return `${ Date.now() }_${ Math.random().toString(16).slice(2) }`;
}

async function loadRulesRoot() {
  const data = await chrome.storage.local.get(STORE_KEY);
  return data[STORE_KEY] || { version: 1, hosts: {} };
}

async function saveRulesRoot(root) {
  await chrome.storage.local.set({ [STORE_KEY]: root });
}

function hideBySelector(selector) {
  try {
    document.querySelectorAll(selector).forEach(el => {
      el.style.display = 'none !important';
    });
  } catch {
    // ignore
  }
}

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

async function onClickCapture(e) {
  if (!selectMode) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  const element = document.elementFromPoint(e.clientX, e.clientY);
  if (!element) return;

  if (element.id && element.id.startsWith('__hidex-')) return;

  const data = buildElementData(element);
  console.log('HideX picked element:', data);

  const selector = data.selector;
  hideBySelector(selector);

  const host = getHost();
  const root = await loadRulesRoot();

  root.hosts[host] = root.hosts[host] || [];

  const exists = root.hosts[host].some(r => r.selector === selector);
  if (exists) return { ok: true, duplicated: true };

  const rule = {
    id: newId(),
    selector,
    data: data.dom,
    createdAt: Date.now()
  };

  root.hosts[host].push(rule);
  await saveRulesRoot(root);

  console.log('HideX rule saved:', selector);

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

applyRulesForHost().then();

async function applyRulesForHost() {
  const rules = await loadRulesRoot();
  const hostRules = rules.hosts[getHost()] || [];

  hostRules.forEach(host => hideBySelector(host.selector));
}

let observer = null;
startObserver();

function startObserver() {
  if (observer) return;

  observer = new MutationObserver(() => {
    applyRulesForHost().then();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
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
