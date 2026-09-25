export class EventBus {
  constructor() { this.map = new Map(); }
  on(event, fn) {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event).add(fn);
    return () => this.map.get(event).delete(fn);
  }
  emit(event, data) { this.map.get(event)?.forEach(fn => fn(data)); }
}