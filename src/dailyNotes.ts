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

export function dailyNotesReady(): boolean {
  return appHasDailyNotesPluginLoaded();
}

/** The Moment for a file iff its basename matches the configured daily-note format, else null. */
export function dateForFile(file: TFile | null): Moment | null {
  if (!file) return null;
  const settings = getDailyNoteSettings();
  if (!settings || !settings.format) return null;
  return getDateFromFile(file, "day");
}

export function isDailyNote(file: TFile | null): boolean {
  return dateForFile(file) !== null;
}

/** getAllDailyNotes throws DailyNotesFolderMissingError if the folder doesn't exist yet. */
export function allDailyNotesSafe(): Record<string, TFile> {
  try {
    return getAllDailyNotes();
  } catch {
    return {};
  }
}

export function existingNoteFor(date: Moment): TFile | null {
  return getDailyNote(date, allDailyNotesSafe()) ?? null;
}

/** Open the note for `date` in `leaf`, creating it from the configured template if absent. */
export async function openOrCreate(date: Moment, leaf: WorkspaceLeaf): Promise<void> {
  let file: TFile | null = existingNoteFor(date);
  if (!file) {
    file = (await createDailyNote(date)) ?? null; // shows its own Notice on failure
  }
  if (file) {
    await leaf.openFile(file);
  }
}
