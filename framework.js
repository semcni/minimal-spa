/**
 * framework.js
 * A minimal reactive framework for dependency-free SPAs.
 */

/**
 * Tagged template literal that builds a DOM element from an HTML string.
 * Strings and numbers are HTML-escaped; DOM nodes and arrays of nodes are
 * inserted directly without escaping.
 *
 * @param {TemplateStringsArray} strings
 * @param {...(string|number|Node|Node[])} values
 * @returns {Element}
 */
export function html(strings, ...values) {
    const template = document.createElement('template')

    template.innerHTML = strings.reduce((acc, str, i) => {
        const value = values[i - 1]
        if (value === undefined) return acc + str
        if (typeof value === 'string' || typeof value === 'number') {
            return acc + escapeHtml(String(value)) + str
        }
        // DOM node or array, use a placeholder slot
        return acc + `<slot data-i="${i - 1}"></slot>` + str
    })

    const el = template.content.firstElementChild

    // Replace placeholder slots with real DOM nodes
    el.querySelectorAll('slot[data-i]').forEach((slot) => {
        const value = values[Number(slot.dataset.i)]
        if (value instanceof Node) {
            slot.replaceWith(value)
        } else if (Array.isArray(value)) {
            slot.replaceWith(...value.map((v) => (v instanceof Node ? v : document.createTextNode(String(v)))))
        }
    })

    return el
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Tagged template literal that builds an SVG element.
 * Works like `html` but parses content in the SVG namespace, making it
 * suitable for constructing SVG fragments (e.g. `<path>` elements in a loop)
 * rather than a full `<svg>` root.
 *
 * @param {TemplateStringsArray} strings
 * @param {...(string|number|Node|Node[])} values
 * @returns {SVGElement}
 */
export function svg(strings, ...values) {
    const template = document.createElement('template')

    template.innerHTML = strings.reduce((acc, str, i) => {
        const value = values[i - 1]
        if (value === undefined) return acc + str
        if (typeof value === 'string' || typeof value === 'number') {
            return acc + escapeHtml(String(value)) + str
        }
        return acc + `<slot data-i="${i - 1}"></slot>` + str
    })

    // Wrap in <svg> so the parser puts everything in SVG namespace,
    // then unwrap to return what the user actually wrote.
    template.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg">${template.innerHTML}</svg>`
    const wrapper = template.content.firstElementChild
    const el = wrapper.firstElementChild

    el.querySelectorAll('slot[data-i]').forEach((slot) => {
        const value = values[Number(slot.dataset.i)]
        if (value instanceof Node) {
            slot.replaceWith(value)
        } else if (Array.isArray(value)) {
            slot.replaceWith(...value.map((v) => (v instanceof Node ? v : document.createTextNode(String(v)))))
        }
    })

    return el
}

/**
 * Wraps a render function with local state, returning the initial DOM element.
 * Calling the `setState` argument passed to `render` merges new state and
 * replaces the element in the DOM.
 *
 * @param {Object} initialState
 * @param {(state: Object, setState: (next: Object) => void) => Element} render
 * @returns {Element}
 */
export function component(initialState, render) {
    let state = { ...initialState }
    let el = render(state, setState)

    function setState(next) {
        state = { ...state, ...next }
        const newEl = render(state, setState)
        el.replaceWith(newEl)
        el = newEl
    }

    return el
}

/**
 * Creates a shared reactive state container for cross-component communication.
 * Subscribers are notified synchronously whenever `setState` is called.
 *
 * @param {Object} initial - Initial state object.
 * @returns {{ getState: () => Object, setState: (next: Object) => void, subscribe: (fn: (state: Object) => void) => () => void }}
 */
export function store(initial) {
    let state = { ...initial }
    const subscribers = new Set()

    return {
        getState() {
            return state
        },
        setState(next) {
            state = { ...next }
            subscribers.forEach((fn) => fn(state))
        },
        subscribe(fn) {
            subscribers.add(fn)
            return () => subscribers.delete(fn) // returns unsubscribe
        },
    }
}

/**
 * Returns a debounced version of `fn` that delays invocation until `ms`
 * milliseconds have elapsed since the last call.
 *
 * @param {(...args: any[]) => void} fn
 * @param {number} ms - Delay in milliseconds.
 * @returns {(...args: any[]) => void}
 */
export function debounce(fn, ms) {
    let timer
    return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), ms)
    }
}

const injected = new Set()

/**
 * Tagged template literal that injects a CSS rule set into `<head>` once.
 * Subsequent calls with the same template are no-ops, so it is safe to call
 * on every render.
 *
 * @param {TemplateStringsArray} strings
 * @param {...*} values
 * @returns {void}
 */
export function css(strings, ...values) {
    const key = strings.raw.join('\0') // stable identity for this template
    if (injected.has(key)) return
    injected.add(key)

    const text = strings.reduce((acc, str, i) => acc + (values[i - 1] ?? '') + str)
    const style = document.createElement('style')
    style.textContent = text
    document.head.appendChild(style)
}
