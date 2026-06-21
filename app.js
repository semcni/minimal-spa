import { html } from './framework.js';
import { Header }          from './components/header.js';
import { CounterDisplay }  from './components/counter-display.js';
import { CounterControls } from './components/counter-controls.js';
import { LocalCounter }    from './components/local-counter.js';
import { CardList }        from './components/card-list.js';

// app.js is the composition root.
// Instantiate components, then nest them using html``.

function App() {
  const header   = Header({ title: 'minimal-spa', subtitle: 'A minimal reactive SPA template' });
  const display  = CounterDisplay();
  const controls = CounterControls();
  const local    = LocalCounter();
  const cards    = CardList();

  return html`
    <div class="app">
      ${header}

      <main class="main">
        <section class="section">
          <h2>Shared state</h2>
          <p class="hint">Both components below talk through the same store.</p>
          ${display}
          ${controls}
        </section>

        <section class="section">
          <h2>Local state</h2>
          <p class="hint">This counter is self-contained. State lives inside the component.</p>
          ${local}
        </section>

        <section class="section">
          <h2>Derived list</h2>
          <p class="hint">Re-renders whenever the shared counter changes.</p>
          ${cards}
        </section>
      </main>
    </div>
  `;
}

document.getElementById('app').appendChild(App());
