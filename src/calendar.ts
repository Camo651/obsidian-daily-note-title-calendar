import { App, WorkspaceLeaf, moment, setIcon } from "obsidian";
import type { Moment } from "moment";
import { getDailyNote } from "obsidian-daily-notes-interface";
import { allDailyNotesSafe, openOrCreate } from "./dailyNotes";
import type { DailyNoteCalendarSettings } from "./settings";

/** A floating month-grid calendar for selecting and opening a daily note. */
export class CalendarPopover {
  /** The Obsidian app instance. */
  private app: App;
  /** The plugin settings controlling week start and related behavior. */
  private settings: DailyNoteCalendarSettings;
  /** The leaf in which a selected day's note is opened. */
  private leaf: WorkspaceLeaf;
  /** The element the popover is positioned beneath. */
  private anchor: HTMLElement;
  /** The day of the currently open note, highlighted as selected. */
  private selected: Moment;
  /** The month currently displayed in the grid. */
  private viewMonth: Moment;
  /** The popover's root element while open, otherwise null. */
  private rootEl: HTMLElement | null = null;
  /** Teardown callbacks run when the popover closes. */
  private cleanups: Array<() => void> = [];

  /** Creates a popover anchored to an element and focused on a selected day. */
  constructor(
    app: App,
    settings: DailyNoteCalendarSettings,
    leaf: WorkspaceLeaf,
    anchor: HTMLElement,
    selected: Moment
  ) {
    this.app = app;
    this.settings = settings;
    this.leaf = leaf;
    this.anchor = anchor;
    this.selected = selected.clone();
    this.viewMonth = selected.clone().startOf("month");
  }

  /** Renders the popover, positions it, and attaches listeners that dismiss or reposition it. */
  open(): void {
    this.close();
    this.rootEl = document.body.createDiv({ cls: "dnc-popover" });
    this.render();
    this.position();

    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (this.rootEl && !this.rootEl.contains(t) && !this.anchor.contains(t)) {
        this.close();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") this.close();
    };
    const reposition = () => this.position();

    const timer = window.setTimeout(
      () => document.addEventListener("pointerdown", onPointerDown, true),
      0
    );
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", reposition, true);
    window.addEventListener("scroll", reposition, true);

    this.cleanups.push(() => window.clearTimeout(timer));
    this.cleanups.push(() => document.removeEventListener("pointerdown", onPointerDown, true));
    this.cleanups.push(() => document.removeEventListener("keydown", onKey, true));
    this.cleanups.push(() => window.removeEventListener("resize", reposition, true));
    this.cleanups.push(() => window.removeEventListener("scroll", reposition, true));
  }

  /** Detaches all listeners and removes the popover from the DOM. */
  close(): void {
    this.cleanups.forEach((fn) => fn());
    this.cleanups = [];
    this.rootEl?.remove();
    this.rootEl = null;
  }

  /** Returns the zero-based weekday (0 = Sunday) the grid should start on. */
  private firstWeekday(): number {
    switch (this.settings.weekStart) {
      case "sunday":
        return 0;
      case "monday":
        return 1;
      case "saturday":
        return 6;
      default:
        return moment.localeData().firstDayOfWeek();
    }
  }

  /** Draws the header, weekday labels, and day grid for the current view month. */
  private render(): void {
    const root = this.rootEl;
    if (!root) return;
    root.empty();

    const header = root.createDiv({ cls: "dnc-pop-header" });
    const prev = header.createEl("button", { cls: "dnc-pop-nav", text: "\u2039" });
    const center = header.createDiv({ cls: "dnc-pop-center" });
    const title = center.createDiv({
      cls: "dnc-pop-title",
      text: this.viewMonth.format("MMMM YYYY"),
    });
    const todayBtn = center.createEl("button", {
      cls: "dnc-pop-today",
      attr: { "aria-label": "Jump to today" },
    });
    setIcon(todayBtn, "calendar");
    const next = header.createEl("button", { cls: "dnc-pop-nav", text: "\u203A" });
    prev.onclick = () => {
      this.viewMonth.subtract(1, "month");
      this.render();
    };
    next.onclick = () => {
      this.viewMonth.add(1, "month");
      this.render();
    };
    const goToday = () => {
      this.viewMonth = moment().startOf("month");
      this.render();
    };
    title.onclick = goToday;
    todayBtn.onclick = goToday;

    const firstWd = this.firstWeekday();
    const minNames = moment.weekdaysMin();
    const wdRow = root.createDiv({ cls: "dnc-pop-weekdays" });
    for (let i = 0; i < 7; i++) {
      wdRow.createDiv({ cls: "dnc-pop-weekday", text: minNames[(firstWd + i) % 7] ?? "" });
    }

    const grid = root.createDiv({ cls: "dnc-pop-grid" });
    const monthStart = this.viewMonth.clone().startOf("month");
    const gridStart = monthStart.clone();
    const offset = (monthStart.day() - firstWd + 7) % 7;
    gridStart.subtract(offset, "day");

    const today = moment().startOf("day");
    const notes = allDailyNotesSafe();

    for (let i = 0; i < 42; i++) {
      const day = gridStart.clone().add(i, "day");
      const cell = grid.createDiv({ cls: "dnc-pop-day", text: String(day.date()) });
      if (!day.isSame(this.viewMonth, "month")) cell.addClass("is-outside");
      if (day.isSame(today, "day")) cell.addClass("is-today");
      if (day.isSame(this.selected, "day")) cell.addClass("is-selected");
      if (getDailyNote(day, notes)) cell.addClass("has-note");
      cell.onclick = async () => {
        await openOrCreate(day, this.leaf);
        this.close();
      };
    }
  }

  /** Places the popover just below the anchor, clamped within the viewport width. */
  private position(): void {
    const root = this.rootEl;
    if (!root) return;
    const r = this.anchor.getBoundingClientRect();
    const pad = 8;
    const width = root.offsetWidth || 260;
    let left = Math.round(r.left);
    if (left + width + pad > window.innerWidth) {
      left = Math.max(pad, window.innerWidth - width - pad);
    }
    root.style.position = "fixed";
    root.style.top = `${Math.round(r.bottom + 4)}px`;
    root.style.left = `${left}px`;
  }
}
