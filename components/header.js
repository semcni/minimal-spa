import { html } from '../framework.js';

// A stateless component, just a function that takes props and returns a DOM node.
// No store, no component() wrapper needed.

export function Header({ title, subtitle }) {
  return html`
    <header class="header">
      <h1 class="header__title">${title}</h1>
      <p class="header__subtitle">${subtitle}</p>
    </header>
  `;
}
