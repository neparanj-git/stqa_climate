import { EventEmitter } from 'node:events';

export type ClimateEvent = { type: 'observation' | 'alert' | 'alert-updated'; payload: unknown; emittedAt: string };

class ClimateEventBus extends EventEmitter {
  publish(type: ClimateEvent['type'], payload: unknown) {
    const event: ClimateEvent = { type, payload, emittedAt: new Date().toISOString() };
    queueMicrotask(() => this.emit('climate-event', event));
    return event;
  }
}

export const climateEvents = new ClimateEventBus();
