const DEFAULTS = { fontSize: 13, theme: 'auto', wrap: false };
const fields = { theme: 'value', fontSize: 'valueAsNumber', wrap: 'checked' };

chrome.storage.sync.get(DEFAULTS, (settings) => {
  for (const [id, prop] of Object.entries(fields)) {
    const el = document.getElementById(id);
    el[prop] = settings[id];
    el.addEventListener('change', () => {
      const value = el[prop];
      if (id === 'fontSize' && !(value >= 9 && value <= 24)) return;
      chrome.storage.sync.set({ [id]: value });
    });
  }
});
