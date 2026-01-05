console.log('HideX service-worker.js loaded');

chrome.runtime.onInstalled.addListener(() => console.log('HideX installed or updated'));
