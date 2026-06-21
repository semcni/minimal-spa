import { html } from '../framework.js';
import { increment, decrement } from '../stores/counter.js';

// A component that writes to the shared store.
// Completely independent from CounterDisplay. They're connected only via the store.

export function CounterControls() {
  const el = html`
    <div class="counter-controls">
      <button class="btn" id="dec">−</button>
      <button class="btn" id="inc">+</button>
    </div>
  `;

  el.querySelector('#dec').addEventListener('click', decrement);
  el.querySelector('#inc').addEventListener('click', increment);

  return el;
}
