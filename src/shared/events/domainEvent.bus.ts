type Handler<TPayload> = (payload: TPayload) => void | Promise<void>;

export class DomainEventBus<TEvents extends Record<string, unknown>> {
  private readonly handlers = new Map<keyof TEvents, Set<Handler<any>>>();

  subscribe<TEvent extends keyof TEvents>(
    event: TEvent,
    handler: Handler<TEvents[TEvent]>,
  ): () => void {
    const handlers = this.handlers.get(event) ?? new Set<Handler<any>>();
    handlers.add(handler);
    this.handlers.set(event, handlers);
    return () => handlers.delete(handler);
  }

  publish<TEvent extends keyof TEvents>(event: TEvent, payload: TEvents[TEvent]): void {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.size === 0) return;

    for (const handler of handlers) {
      void Promise.resolve(handler(payload)).catch((error) => {
        console.error(`Domain event handler failed for ${String(event)}:`, error);
      });
    }
  }
}

