# minimal-spa

A minimal template for building single-page applications with no dependencies, no build step, and no npm.

## Philosophy

Keep it super simple to reduce maintainence, but thinking with components is kinda nice compared to just separate HTML-, CSS-, and JS-files. 

## Getting started

Browsers block ES module imports on `file://` for security reasons, so you need a local server. You may already have python, which ships with one:

```bash
python3 -m http.server
```

Then open `http://localhost:8000`.


## Project structure

```
/
  index.html        Entry point — mounts #app and loads app.js
  app.js            Composition root — assembles your top-level layout
  framework.js      The reactive core (~60 lines)
  style.css         Global styles
  components/       One file per exported component
  stores/           Shared state
```

## Core concepts

### html\`\`

A tagged template literal that lets you write HTML-like markup and interpolate both strings and DOM nodes.

```js
import { html } from '../framework.js';

const name = 'world';
const el = html`<p>Hello, ${name}!</p>`;
document.body.appendChild(el);
```

Interpolating another component:

```js
const icon  = Icon({ name: 'star' });
const label = html`<span>Rating</span>`;

const el = html`
  <div class="rating">
    ${icon}
    ${label}
  </div>
`;
```

Arrays work too, which makes mapping over lists natural:

```js
const items = ['one', 'two', 'three'];
const el = html`
  <ul>
    ${items.map(item => html`<li>${item}</li>`)}
  </ul>
`;
```

> **Note:** string values are HTML-escaped automatically. DOM nodes are inserted directly.

### svg\`\`

Works like ``` html`` ``` with the same interpolation rules, same escaping, but parses its contents in the SVG namespace. You need it only when building SVG fragments (e.g. a `<path>`, a `<g>`, a list of `<circle>` elements) that will be inserted into an existing SVG element.

For a complete `<svg>...</svg>` document, plain ``` html`` ``` works fine. ``` svg`` ``` is for the inner pieces, where the namespace matters:

```js
import { html, svg } from '../framework.js';

const points = [[10, 20], [30, 40], [50, 25]];

const circles = points.map(([cx, cy]) =>
  svg`<circle cx="${cx}" cy="${cy}" r="3" fill="currentColor" />`
);

const chart = html`
  <svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
    ${circles}
  </svg>
`;
```
### css\`\`

A tagged template literal that lets you write CSS and have it injected into the document on load. It's equivalent to writing the same rules in a regular `.css` file (same global scope, same cascade) the purpose is to let you keep styles next to the component that uses them.

```js
// components/report.js
import { html, css } from '../framework.js'

export function Report({ label, duration }) {
  return html`
    <div class="report">
      <span class="report-label">${label}</span>
      <span class="report-duration">${duration}</span>
    </div>
  `
}

css`
  .report {
    display: flex;
    font-size: 0.9rem;
  }
  .report span {
    padding: 0.5rem;
  }
  .report-label {
    color: var(--muted);
  }
  .report-duration {
    margin-left: auto;
  }
`

```

The `css` call sits at module top level so the styles are injected as soon as the component module is imported. Each unique template is injected only once, no matter how many times the module is evaluated.

> **Scoping with `@scope`.**  
> Because `css` injects into the global stylesheet, it's easy to run into class name conflicts. Above we solved it with prefixing, but you can use the native CSS [`@scope`](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) at-rule:
> ```js
> css`
>   @scope (.report) {
>     :scope {
>       display: flex;
>       font-size: 0.9rem;
>     }
>     span {
>       padding: 0.5rem;
>     }
>     .label {
>       color: var(--muted);
>     }
>     .duration {
>       margin-left: auto;
>     }
>   }
> `
> ```
>
> Here super general selectors like `span` and `.label` become viable as they only match inside `.report`.  
> `:scope` is shorthand for `.report`.

### Stateless components

A component with no state is just a function that takes props and returns a DOM node. No `component()` wrapper needed.

```js
// components/badge.js
import { html } from '../framework.js';

export function Badge({ label, color }) {
  return html`<span class="badge" style="background:${color}">${label}</span>`;
}
```

Usage:

```js
import { Badge } from './components/badge.js';

const el = Badge({ label: 'New', color: '#2563eb' });
```

### Local state with `component()`

Use `component()` when a piece of UI manages its own state that nothing else needs to read.

```js
import { component, html } from '../framework.js';

export function Counter() {
  return component(
    { count: 0 },              // initial state
    (state, setState) => {     // render function — called on every state change
      const el = html`
        <div>
          <p>Count: ${state.count}</p>
          <button class="btn">Increment</button>
        </div>
      `;

      el.querySelector('button').addEventListener('click', () => {
        setState({ count: state.count + 1 });
      });

      return el;
    }
  );
}
```

`setState` merges the object you pass in with the current state (like React's class component `setState`), then re-renders the component by replacing it in the DOM.

### Shared state with `store()`

Use a store when multiple components need to read from or write to the same data.

**Define the store:**

```js
// stores/theme.js
import { store } from '../framework.js';

export const themeStore = store({ dark: false });

export function toggleTheme() {
  const { dark } = themeStore.getState();
  themeStore.setState({ dark: !dark });
}
```

**Subscribe in a component:**

```js
// components/theme-toggle.js
import { html } from '../framework.js';
import { themeStore, toggleTheme } from '../stores/theme.js';

export function ThemeToggle() {
  const el = html`<button class="btn">Toggle theme</button>`;
  el.addEventListener('click', toggleTheme);
  return el;
}
```

**Read in a different component:**

```js
// components/app-shell.js
import { html } from '../framework.js';
import { themeStore } from '../stores/theme.js';

export function AppShell() {
  const el = html`<div class="app-shell"></div>`;

  themeStore.subscribe(state => {
    el.classList.toggle('dark', state.dark);
  });

  return el;
}
```

The two components are completely independent and communicate only through the store. Any number of components can subscribe to the same store.

> **Note:** unlike `component()`, a store's `setState` *replaces* the state rather than merging into it. If your store holds multiple keys, read the current state with `getState()` and spread it in:
>
> ```js
> // stores/user.js
> export const userStore = store({ name: 'Anon', loggedIn: false });
>
> export function login(name) {
>   userStore.setState({ ...userStore.getState(), name, loggedIn: true });
> }
> ```
>
> Without the spread, `loggedIn` would disappear.
>
> Handling this with deticated setter fuctions in the store is preferable. The Patterns section further down describes this.

### Dynamic lists with `replaceChildren()`

When a list of items changes, use `replaceChildren()` to swap out children. The parent element stays in the DOM; only its contents are replaced.

```js
import { html } from '../framework.js';
import { todoStore } from '../stores/todos.js';

function TodoItem({ text, done }) {
  return html`<li class="${done ? 'done' : ''}">${text}</li>`;
}

export function TodoList() {
  const el = html`<ul class="todo-list"></ul>`;

  function render(state) {
    el.replaceChildren(...state.todos.map(TodoItem));
  }

  todoStore.subscribe(render);
  render(todoStore.getState()); // render immediately on mount

  return el;
}
```

Child components rendered this way (`TodoItem`) don't need subscriptions as they're just functions. The parent owns the subscription and recreates children as needed.

### Composing components

Instantiate child components, then interpolate them into a parent with ``` html`` ```:

```js
// app.js
import { html }       from './framework.js';
import { Header }     from './components/header.js';
import { Sidebar }    from './components/sidebar.js';
import { MainContent} from './components/main-content.js';

function App() {
  const header  = Header({ title: 'My App' });
  const sidebar = Sidebar();
  const content = MainContent();

  return html`
    <div class="app">
      ${header}
      <div class="layout">
        ${sidebar}
        ${content}
      </div>
    </div>
  `;
}

document.getElementById('app').appendChild(App());
```

### Unsubscribing

For components that are permanently mounted (typical in SPAs), subscriptions can be left open. If you do mount and unmount components dynamically, clean up to avoid memory leaks:

```js
export function Modal() {
  const el = html`<div class="modal">...</div>`;

  const unsubscribe = someStore.subscribe(state => {
    // update el
  });

  // Store the cleanup function on the element
  el._cleanup = unsubscribe;

  return el;
}

// When removing the modal:
modal._cleanup?.();
modal.remove();
```

### Debounce

A utility for rate-limiting functions. Useful when saving to `localStorage` or making network requests on user input.

```js
import { debounce } from '../framework.js';

const save = debounce((value) => {
  localStorage.setItem('draft', value);
}, 500); // waits 500ms after the last call before firing

textarea.addEventListener('input', () => save(textarea.value));
```

## Patterns

### Data in, events out

Components should receive data as props and communicate changes upward via store actions, not by mutating props directly:

```js
// Ok
import { html } from '../framework.js';
import { deleteItem } from '../stores/todos.js';

export function TodoItem({ id, text }) {
  const el = html`<li>${text} <button>Delete</button></li>`;
  el.querySelector('button').addEventListener('click', () => deleteItem(id));
  return el;
}

// Avoid 
// Reaching into shared state from inside a dumb component
export function TodoItem({ item }) {
  const el = html`<li>${item.text}</li>`;
  el.addEventListener('click', () => {
    todoStore.setState(...); // component is now coupled to the store
  });
  return el;
}
```

### One store per domain

Split stores by concern rather than having one giant global store:

```
stores/
  todos.js    // todo items, filters
  user.js     // auth state, preferences
  ui.js       // sidebar open/closed, modal state
```

### Keep components focused

If a component file is getting long, it probably contains too many concerns. Split it up. A filtering component and a display component are easier to render about separately than a single component that does both.

## framework.js reference

| Export      | Signature                           | Description                                                                                                                                                                                                            |
| ----------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `html`      | ``html`<tag>...` ``                 | Tagged template. Returns a DOM node. Accepts strings, numbers, DOM nodes, and arrays of DOM nodes as interpolations.                                                                                                   |
| `svg`       | ``svg`<tag>...` ``                  | Like `html`, but parses contents in the SVG namespace. Use for SVG fragments inserted into an existing `<svg>` element.                                                                                                |
| `css`       | ``css`...` ``                       | Tagged template. Injects the CSS into the global scope. Idempotent: each unique template is injected only once.                                                                                                        |
| `component` | `component(initialState, renderFn)` | Local state wrapper. `renderFn(state, setState)` is called on each state change and must return a DOM node. `setState` merges its argument into the current state.                                                     |
| `store`     | `store(initialState)`               | Creates a shared store with `getState()`, `setState(next)`, and `subscribe(fn)` methods. `setState` *replaces* the state. Spread the previous state if you want to merge. `subscribe` returns an unsubscribe function. |
| `debounce`  | `debounce(fn, ms)`                  | Returns a debounced version of `fn` that only fires after `ms` milliseconds of inactivity.                                                                                                                             |
