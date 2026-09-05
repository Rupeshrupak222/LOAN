import { EventEmitter } from 'events';
import { SystemEvent } from './early-warning.types';
import { logAudit } from '../audit/audit.service';

export type SystemEventHandler<T = any> = (event: SystemEvent<T>) => Promise<void> | void;

export class EventBusService {
  private static instance: EventBusService;
  private readonly emitter = new EventEmitter();

  private constructor() {
    this.emitter.setMaxListeners(50);
  }

  public static getInstance(): EventBusService {
    if (!EventBusService.instance) {
      EventBusService.instance = new EventBusService();
    }
    return EventBusService.instance;
  }

  /**
   * Generates a canonical event ID.
   */
  public generateEventId(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `EVT-${date}-${rand}`;
  }

  /**
   * Publishes a typed SystemEvent to all registered subscribers.
   */
  public async publish<T = any>(event: Omit<SystemEvent<T>, 'eventId' | 'occurredAt'> & { eventId?: string; occurredAt?: string }): Promise<SystemEvent<T>> {
    const fullEvent: SystemEvent<T> = {
      ...event,
      eventId: event.eventId || this.generateEventId(),
      occurredAt: event.occurredAt || new Date().toISOString(),
    };

    // Emit specifically by eventType and wildcard '*'
    this.emitter.emit(fullEvent.eventType, fullEvent);
    this.emitter.emit('*', fullEvent);

    // Auto-audit high/critical events
    if (fullEvent.severity === 'HIGH' || fullEvent.severity === 'CRITICAL') {
      logAudit({
        action: `EVENT_${fullEvent.eventType}`,
        entity: fullEvent.entityType,
        entityId: fullEvent.entityId,
        newValue: {
          severity: fullEvent.severity,
          source: fullEvent.source,
          metadata: fullEvent.metadata,
        },
        correlationId: fullEvent.correlationId,
      }).catch(() => {});
    }

    return fullEvent;
  }

  /**
   * Subscribes to a specific eventType or wildcard '*'.
   */
  public subscribe(eventType: string, handler: SystemEventHandler): () => void {
    const safeHandler = async (event: SystemEvent) => {
      try {
        await handler(event);
      } catch (err) {
        console.error(`[EventBus] Handler error on '${eventType}':`, err);
      }
    };

    this.emitter.on(eventType, safeHandler);
    return () => {
      this.emitter.off(eventType, safeHandler);
    };
  }

  public clearAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

export const eventBus = EventBusService.getInstance();
