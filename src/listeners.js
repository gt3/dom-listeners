let _throttleEvents = { resize: '_resize' }

function throttleProxy(throttledKey, target) {
    let running = false
    let dispatch = () => {
        target.dispatchEvent(new CustomEvent(throttledKey))
        running = false
    }
    let proxy = () => {
        if(!running) {
            running = true
            requestAnimationFrame(dispatch)
        }
    }
    return proxy
}

class Listener {
    constructor(eventKey, listener, target=window, throttleEvents=_throttleEvents) {
        let throttledKey = throttleEvents[eventKey]
        Object.assign(this, {eventKey, throttledKey, listener, target})
    }
    get addFn() { return this.target.addEventListener || this.target.attachEvent }
    throttle() {
        let proxy = throttleProxy(this.throttledKey, this.target)
        this.addFn.call(this.target, this.eventKey, proxy)
    }
    add() {
        if(this.throttledKey) this.throttle()
        this.addFn.call(this.target, this.throttledKey || this.eventKey, this.listener)
    }
    get removeFn() { return this.target.removeEventListener || this.target.detachEvent }
    remove() {
        this.removeFn.call(this.target, this.throttledKey || this.eventKey, this.listener)
    }
    static create(eventType, listener, target, throttleEvents) {
        if(!target && typeof window !== 'object') return void(0)
        return new Listener(eventType, listener, target, throttleEvents) 
    }
}

function addListeners(handlers, elem, actions) {
    let listeners = {}
    if(handlers) {
        let registeredListeners = Object.keys(handlers).map(k => {
            let action = actions[k], handler = handlers[k], registered
            let removeAction = removeListener.bind(null, listeners, k)
            if(action) {
                registered = Listener.create(k, handler.bind(null, action, removeAction, elem))
                registered.add()
            }
            return {[k]: registered}
        })
        Object.assign(listeners, ...registeredListeners)
    }
    return listeners
}
function removeListener(listeners, key) {
    return listeners[key] && listeners[key].remove()
}
function removeListeners(listeners) {
    if(listeners) Object.keys(listeners).forEach(removeListener.bind(null, listeners))
}

class Listeners {
    constructor(handlers, elem) {
        Object.assign(this, {handlers, elem, listeners: null})
    }
    attachOnce(actions) {
        this.listeners = this.listeners || addListeners(this.handlers, this.elem, actions)
        return this.remove.bind(this)
    }
    remove() {
        return removeListeners(this.listeners)
    }
    static createAndAttach(handlers, elem, actions) {
        return new Listeners(handlers, elem).attachOnce(actions)
    }
}

export default Listeners.createAndAttach