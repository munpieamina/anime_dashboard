export class EventBus {
  #events = new Map();

  on(eventName, handler) {
    if (!this.#events.has(eventName)) {
      this.#events.set(eventName, new Set());
    }

    const listeners = this.#events.get(eventName);
    listeners.add(handler);

    return () => listeners.delete(handler);
  }

  emit(eventName, payload) {
    this.#events.get(eventName)?.forEach((handler) => handler(payload));
  }
}
