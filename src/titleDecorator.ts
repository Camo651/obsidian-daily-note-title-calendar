import { MarkdownView, WorkspaceLeaf, moment, setIcon } from "obsidian";
import type { Moment } from "moment";
import { dateForFile, openOrCreate } from "./dailyNotes";
import { CalendarPopover } from "./calendar";
import type DailyNoteCalendarPlugin from "./main";

const BAR_CLASS = "dnc-title-bar";
const HIDE_CLASS = "dnc-hide-native-title";

export class TitleDecorator {
  private plugin: DailyNoteCalendarPlugin;
  private popover: CalendarPopover | null = null;
  private observers = new Map<WorkspaceLeaf, MutationObserver>();

  constructor(plugin: DailyNoteCalendarPlugin) {
    this.plugin = plugin;
  }

  refreshAll = (): void => {
    this.plugin.app.workspace
      .getLeavesOfType("markdown")
      .forEach((leaf) => this.decorateLeaf(leaf));
  };

  private getInlineTitleEl(view: MarkdownView): HTMLElement | null {
    const direct = (view as unknown as { inlineTitleEl?: HTMLElement }).inlineTitleEl;
    if (direct && direct.isConnected) return direct;
    return view.contentEl.querySelector<HTMLElement>(".inline-title");
  }

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

    // Column holding the (centered) chip and the arrows+title row. Keeping the
    // chip inside this shrink-to-content column centers it over the
    // prev/date/next block rather than the full editor width.
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

  private observe(leaf: WorkspaceLeaf, parent: HTMLElement): void {
    this.observers.get(leaf)?.disconnect();
    const obs = new MutationObserver(() => {
      window.requestAnimationFrame(() => this.decorateLeaf(leaf));
    });
    obs.observe(parent, { childList: true });
    this.observers.set(leaf, obs);
  }

  private undecorate(leaf: WorkspaceLeaf, parent: HTMLElement): void {
    this.observers.get(leaf)?.disconnect();
    this.observers.delete(leaf);
    parent.removeClass(HIDE_CLASS);
    parent.querySelectorAll(`:scope > .${BAR_CLASS}`).forEach((el) => el.remove());
  }

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
