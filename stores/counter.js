import { store } from '../framework.js';

// A shared store that any component can read from or write to.
// Import `counterStore` to subscribe to changes.
// Import `increment` / `decrement` to trigger updates.

export const counterStore = store({
  count: 0,
});

export function increment() {
  const { count } = counterStore.getState();
  counterStore.setState({ count: count + 1 });
}

export function decrement() {
  const { count } = counterStore.getState();
  counterStore.setState({ count: count - 1 });
}
