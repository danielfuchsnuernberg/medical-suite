// The stamps every record carries (REACH Core R4).
import type { Moment } from "./dates";

export type RecordState = "Active" | "Archived";
export interface Stamps { id: string; createdAt: Moment; createdBy: string; changedAt: Moment; changedBy: string; country: string; state: RecordState }
export type StoredRecord = Stamps & Record<string, unknown>;
