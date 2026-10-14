import { MarkdownView, WorkspaceLeaf, moment, setIcon } from "obsidian";
import type { Moment } from "moment";
import { dateForFile, openOrCreate } from "./dailyNotes";
import { CalendarPopover } from "./calendar";
import type DailyNoteCalendarPlugin from "./main";

/** Class name of the injected container that replaces the native title. */
const BAR_CLASS = "dnc-title-bar";
/** Class name placed on the title's parent to hide the native inline title. */
const HIDE_CLASS = "dnc-hide-native-title";

/** Replaces the inline title of daily notes with a date display and navigation controls. */
export class TitleDecorator {
  /** The owning plugin instance. */
  private plugin: DailyNoteCalendarPlugin;
  /** The currently open calendar popover, if any. */
  private popover: CalendarPopover | null = null;
  /** Observers, one per decorated leaf, that re-decorate when the title is rebuilt. */
  private observers = new Map<WorkspaceLeaf, MutationObserver>();

  /** Creates a decorator bound to a plugin instance. */
  constructor(plugin: DailyNoteCalendarPlugin) {
    this.plugin = plugin;
  }

  /** Re-evaluates and updates the decoration on every open markdown leaf. */
  refreshAll = (): void => {
    this.plugin.app.workspace
      .getLeavesOfType("markdown")
      .forEach((leaf) => this.decorateLeaf(leaf));
  };

  /** Returns the inline-title element for a markdown view, or null if it is not present. */
  private getInlineTitleEl(view: MarkdownView): HTMLElement | null {
    const direct = (view as unknown as { inlineTitleEl?: HTMLElement }).inlineTitleEl;
    if (direct && direct.isConnected) return direct;
    return view.contentEl.querySelector<HTMLElement>(".inline-title");
  }

  /** Adds, updates, or removes the title decoration for a single leaf based on its file. */
  private decorateLeaf(leaf: WorkspaceLeaf): void {
    const view = leaf.view;
    if (!(view instanceof MarkdownView)) return;

    const titleEl = this.getInlineTitleEl(view);
    if (!titleEl) return;
    const parent = titleEl.parentElement;
    if (!parent) return;

    const date = dateForFile(view.file);
    if (!date) {
      this.undecorate(leaf, parent);
      return;
    }

    parent.addClass(HIDE_CLASS);

    let bar = parent.querySelector<HTMLElement>(`:scope > .${BAR_CLASS}`);
    if (!bar) {
      bar = createDiv({ cls: BAR_CLASS });
      parent.insertAfter(bar, titleEl);
      this.observe(leaf, parent);
    }
    this.renderBar(bar, leaf, date, view.file?.basename ?? "");
  }

  /** Renders the date label, optional chip, navigation arrows, and jump button into the bar. */
  private renderBar(
    bar: HTMLElement,
    leaf: WorkspaceLeaf,
    date: Moment,
    basename: string
  ): void {
    bar.empty();
    const { showArrows, showRichTitle, displayFormat } = this.plugin.settings;
    const labelText = showRichTitle ? date.format(displayFormat) : basename;

    const isToday = date.isSame(moment(), "day");

    const main = bar.createDiv({ cls: "dnc-title-main" });

    if (isToday && this.plugin.settings.showTodayChip) {
      main.createDiv({ cls: "dnc-today-chip", text: "Today" });
    }

    const row = main.createDiv({ cls: "dnc-title-row" });

    if (showArrows) {
      const prev = row.createEl("button", {
        cls: "dnc-arrow",
        attr: { "aria-label": "Previous day" },
      });
      setIcon(prev, "chevron-left");
      prev.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await openOrCreate(date.clone().subtract(1, "day"), leaf);
      };
    }

    const label = row.createDiv({ cls: "dnc-date", text: labelText });
    label.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openCalendar(leaf, label, date);
    };

    if (showArrows) {
      const next = row.createEl("button", {
        cls: "dnc-arrow",
        attr: { "aria-label": "Next day" },
      });
      setIcon(next, "chevron-right");
      next.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await openOrCreate(date.clone().add(1, "day"), leaf);
      };
    }

    if (!isToday) {
      const jump = bar.createEl("button", {
        cls: "dnc-today-btn",
        attr: { "aria-label": "Go to today's note" },
      });
      setIcon(jump, "calendar");
      jump.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await openOrCreate(moment(), leaf);
      };
    }
  }

  /** Opens a calendar popover anchored to an element for selecting a day. */
  private openCalendar(leaf: WorkspaceLeaf, anchor: HTMLElement, date: Moment): void {
    this.popover?.close();
    this.popover = new CalendarPopover(
      this.plugin.app,
      this.plugin.settings,
      leaf,
      anchor,
      date
    );
    this.popover.open();
  }

  /** Watches a leaf's title parent and re-decorates when Obsidian rebuilds the title. */
  private observe(leaf: WorkspaceLeaf, parent: HTMLElement): void {
    this.observers.get(leaf)?.disconnect();
    const obs = new MutationObserver(() => {
      window.requestAnimationFrame(() => this.decorateLeaf(leaf));
    });
    obs.observe(parent, { childList: true });
    this.observers.set(leaf, obs);
  }

  /** Removes the decoration and observer for a leaf and restores the native title. */
  private undecorate(leaf: WorkspaceLeaf, parent: HTMLElement): void {
    this.observers.get(leaf)?.disconnect();
    this.observers.delete(leaf);
    parent.removeClass(HIDE_CLASS);
    parent.querySelectorAll(`:scope > .${BAR_CLASS}`).forEach((el) => el.remove());
  }

  /** Closes any popover and strips all decoration from every markdown leaf. */
  destroy(): void {
    this.popover?.close();
    this.popover = null;
    this.observers.forEach((obs) => obs.disconnect());
    this.observers.clear();
    this.plugin.app.workspace.getLeavesOfType("markdown").forEach((leaf) => {
      const view = leaf.view;
      if (view instanceof MarkdownView) {
        const titleEl = this.getInlineTitleEl(view);
        const parent = titleEl?.parentElement ?? null;
        if (parent) {
          parent.removeClass(HIDE_CLASS);
          parent.querySelectorAll(`:scope > .${BAR_CLASS}`).forEach((el) => el.remove());
        }
      }
    });
  }
}
