import { component, html } from '../framework.js';

// A component with its own local state using component().
// Use this when the state doesn't need to be shared with anything else.

export function LocalCounter() {
  return component(
    { count: 0 },
    (state, setState) => {
      const el = html`
        <div class="local-counter">
          <p>Local count: <strong>${state.count}</strong></p>
          <button class="btn">Click me</button>
        </div>
      `;

      el.querySelector('button').addEventListener('click', () => {
        setState({ count: state.count + 1 });
      });

      return el;
    }
  );
}
