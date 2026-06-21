import { html } from '../framework.js';
import { counterStore } from '../stores/counter.js';

// Renders a dynamic list that updates when the store changes.
// Uses replaceChildren() to swap out list items efficiently.
// The parent <ul> stays in the DOM; only the children are replaced.

function Card({ label, value }) {
  return html`
    <li class="card">
      <span class="card__label">${label}</span>
      <span class="card__value">${value}</span>
    </li>
  `;
}

export function CardList() {
  const el = html`<ul class="card-list"></ul>`;

  function render(state) {
    const items = [
      { label: 'Current count', value: state.count },
      { label: 'Doubled',       value: state.count * 2 },
      { label: 'Squared',       value: state.count ** 2 },
    ];
    el.replaceChildren(...items.map(Card));
  }

  counterStore.subscribe(render);
  render(counterStore.getState());

  return el;
}
