import { html } from '../framework.js';
import { counterStore } from '../stores/counter.js';

// A component that reads from shared store and updates when it changes.
// The element itself stays in the DOM, only its inner text changes.

export function CounterDisplay() {
  const el = html`<p class="counter-display">Count: <strong>0</strong></p>`;
  const strong = el.querySelector('strong');

  counterStore.subscribe(state => {
    strong.textContent = state.count;
  });

  // Render the current state immediately on mount
  strong.textContent = counterStore.getState().count;

  return el;
}
