import { SetMetadata } from '@nestjs/common';
import { AnalyticsEvent } from '../analytics-event.enum';

/**
 * Metadata key used internally by NestJS reflection system.
 * This key is used by interceptors or middleware to detect
 * which routes should trigger analytics tracking.
 */
export const TRACK_EVENT_KEY = 'trackEvent';

/**
 * Configuration options for tracking an analytics event.
 * These options define what should be recorded when a route is executed.
 */
export interface TrackEventOptions {
  /**
   * The type of analytics event to emit (e.g. login, signup, purchase).
   */
  event: AnalyticsEvent;

  /**
   * Whether to include request payload data in the analytics event.
   * Useful for debugging or behavioral analysis (be careful with sensitive data).
   */
  includeRequestData?: boolean;

  /**
   * Whether to include response payload data in the analytics event.
   * Useful for tracking outcomes of API calls.
   */
  includeResponseData?: boolean;

  /**
   * Function to extract the user ID from the incoming request.
   * Allows flexible integration with different auth strategies.
   */
  extractUserId?: (req: any) => string;

  /**
   * Function to extract custom metadata from request/response.
   * Used to enrich analytics events with contextual information.
   */
  extractMetadata?: (req: any, res?: any) => Record<string, any>;
}

/**
 * Decorator used to tag routes for analytics tracking.
 *
 * When applied to a controller method, it attaches metadata
 * that can be read by an interceptor to automatically emit events.
 *
 * @example
 * @TrackEvent({
 *   event: AnalyticsEvent.UserLoggedIn,
 *   extractUserId: (req) => req.user?.id,
 *   extractMetadata: (req) => ({ loginMethod: req.body.method })
 * })
 */
export const TrackEvent = (options: TrackEventOptions) =>
  SetMetadata(TRACK_EVENT_KEY, options);