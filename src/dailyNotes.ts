import { TFile, WorkspaceLeaf } from "obsidian";
import type { Moment } from "moment";
import {
  appHasDailyNotesPluginLoaded,
  createDailyNote,
  getAllDailyNotes,
  getDailyNote,
  getDailyNoteSettings,
  getDateFromFile,
} from "obsidian-daily-notes-interface";

/** Reports whether the core Daily Notes (or Periodic Notes) plugin is enabled. */
export function dailyNotesReady(): boolean {
  return appHasDailyNotesPluginLoaded();
}

/** Parses a file's date from its name using the configured format, or null if it is not a daily note. */
export function dateForFile(file: TFile | null): Moment | null {
  if (!file) return null;
  const settings = getDailyNoteSettings();
  if (!settings || !settings.format) return null;
  return getDateFromFile(file, "day");
}

/** Reports whether a file's name matches the configured daily-note format. */
export function isDailyNote(file: TFile | null): boolean {
  return dateForFile(file) !== null;
}

/** Returns all daily notes keyed by date, or an empty map when the daily-note folder is missing. */
export function allDailyNotesSafe(): Record<string, TFile> {
  try {
    return getAllDailyNotes();
  } catch {
    return {};
  }
}

/** Returns the existing daily note for a date, or null if none exists. */
export function existingNoteFor(date: Moment): TFile | null {
  return getDailyNote(date, allDailyNotesSafe()) ?? null;
}

/** Opens the daily note for a date in the given leaf, creating it from the configured template when absent. */
export async function openOrCreate(date: Moment, leaf: WorkspaceLeaf): Promise<void> {
  let file: TFile | null = existingNoteFor(date);
  if (!file) {
    file = (await createDailyNote(date)) ?? null;
  }
  if (file) {
    await leaf.openFile(file);
  }
}
