import { App, PluginSettingTab, Setting } from "obsidian";
import type DailyNoteCalendarPlugin from "./main";

export type WeekStart = "locale" | "sunday" | "monday" | "saturday";

export interface DailyNoteCalendarSettings {
  /** Moment format for the hijacked title, e.g. "dddd, MMMM D, YYYY". */
  displayFormat: string;
  /** First day of the week in the calendar grid. */
  weekStart: WeekStart;
  /** Show the previous/next-day arrows around the title. */
  showArrows: boolean;
  /** Render the date with displayFormat; when off, show the raw file name. */
  showRichTitle: boolean;
  /** Show the "Today" chip above the title on today's note. */
  showTodayChip: boolean;
}

export const DEFAULT_SETTINGS: DailyNoteCalendarSettings = {
  displayFormat: "dddd, MMMM D, YYYY",
  weekStart: "locale",
  showArrows: true,
  showRichTitle: true,
  showTodayChip: true,
};

export class DailyNoteCalendarSettingTab extends PluginSettingTab {
  plugin: DailyNoteCalendarPlugin;

  constructor(app: App, plugin: DailyNoteCalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Show navigation arrows")
      .setDesc("Show the previous/next day arrows around the title.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showArrows).onChange(async (value) => {
          this.plugin.settings.showArrows = value;
          await this.plugin.saveSettings();
          this.plugin.decorator.refreshAll();
        })
      );

    new Setting(containerEl)
      .setName("Show rich date title")
      .setDesc("Replace the note title with a formatted date. When off, the raw file name is shown instead.")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showRichTitle).onChange(async (value) => {
          this.plugin.settings.showRichTitle = value;
          await this.plugin.saveSettings();
          this.plugin.decorator.refreshAll();
          this.display();
        })
      );

    new Setting(containerEl)
      .setName("Show Today chip")
      .setDesc('Show a "Today" chip above the title when viewing today\'s note.')
      .addToggle((t) =>
        t.setValue(this.plugin.settings.showTodayChip).onChange(async (value) => {
          this.plugin.settings.showTodayChip = value;
          await this.plugin.saveSettings();
          this.plugin.decorator.refreshAll();
        })
      );

    new Setting(containerEl)
      .setName("Title date format")
      .setDesc("Moment.js format used to render the date in place of the note title.")
      .addMomentFormat((c) =>
        c
          .setDefaultFormat(DEFAULT_SETTINGS.displayFormat)
          .setValue(this.plugin.settings.displayFormat)
          .onChange(async (value) => {
            this.plugin.settings.displayFormat =
              value.trim() || DEFAULT_SETTINGS.displayFormat;
            await this.plugin.saveSettings();
            this.plugin.decorator.refreshAll();
          })
      )
      .setDisabled(!this.plugin.settings.showRichTitle);

    new Setting(containerEl)
      .setName("Week starts on")
      .setDesc("First day of the week in the calendar.")
      .addDropdown((d) =>
        d
          .addOption("locale", "Use locale default")
          .addOption("sunday", "Sunday")
          .addOption("monday", "Monday")
          .addOption("saturday", "Saturday")
          .setValue(this.plugin.settings.weekStart)
          .onChange(async (value) => {
            this.plugin.settings.weekStart = value as WeekStart;
            await this.plugin.saveSettings();
          })
      );
  }
}
