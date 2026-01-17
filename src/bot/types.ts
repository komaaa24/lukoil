import { Context, SessionFlavor } from 'grammy';
import { BroadcastTarget } from '../db/entities/Broadcast';

export type AdminFlowStep =
  | 'BROADCAST_MESSAGE'
  | 'BROADCAST_TARGET'
  | 'BROADCAST_FILTER'
  | 'BROADCAST_SCHEDULE'
  | 'USER_LOOKUP';

export type SessionData = {
  pendingToken: string | null;
  pendingScannedAt: string | null;
  awaitingPhone: boolean;
  lastToken: string | null;
  lastScanAt: number | null;
  phoneRequestedAt: number | null;
  onboarding?: {
    step: 'LANG' | 'BRAND' | 'OIL' | 'MILEAGE';
    language?: string;
    vehicleBrand?: string;
    oilType?: string;
  };
  complaint?: {
    tokenRaw?: string;
    reason?: string;
  };
  adminFlow?: {
    step: AdminFlowStep;
    draft?: {
      messageText?: string;
      target?: BroadcastTarget;
      scheduledAt?: string | null;
      filterValue?: string | null;
    };
  };
};

export type BotContext = Context & SessionFlavor<SessionData>;
