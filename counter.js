// counter.js
document.addEventListener('DOMContentLoaded', () => {
  const visitEl = document.getElementById('visit-count');
  if (!visitEl) return;  // only run on pages with a #visit-count
  fetch('https://abacus.jasoncameron.dev/hit/shankapotamus88/visitor')
    .then(r => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    })
    .then(data => {
      visitEl.textContent = `Total visits: ${data.value}`;
    })
    .catch(err => {
      console.error('Abacus error:', err);
      visitEl.textContent = 'Visits unavailable';
    });
});
