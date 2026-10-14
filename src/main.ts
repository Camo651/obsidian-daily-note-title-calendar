import { Notice, Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  DailyNoteCalendarSettings,
  DailyNoteCalendarSettingTab,
} from "./settings";
import { TitleDecorator } from "./titleDecorator";
import { dailyNotesReady } from "./dailyNotes";

/** Plugin entry point that decorates daily-note titles and wires up refresh events. */
export default class DailyNoteCalendarPlugin extends Plugin {
  /** The loaded, persisted settings. */
  settings!: DailyNoteCalendarSettings;
  /** The controller that renders and maintains the title decoration. */
  decorator!: TitleDecorator;

  /** Loads settings, registers the decorator and events, and performs the initial decoration. */
  async onload(): Promise<void> {
    await this.loadSettings();
    this.decorator = new TitleDecorator(this);
    this.addSettingTab(new DailyNoteCalendarSettingTab(this.app, this));

    this.app.workspace.onLayoutReady(() => {
      if (!dailyNotesReady()) {
        new Notice(
          'Daily Note Calendar: enable the core "Daily notes" plugin (or Periodic Notes) to use this plugin.'
        );
      }
      this.decorator.refreshAll();
    });

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.decorator.refreshAll())
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.decorator.refreshAll())
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.decorator.refreshAll())
    );
  }

  /** Removes all title decoration when the plugin is disabled. */
  onunload(): void {
    this.decorator?.destroy();
  }

  /** Loads persisted settings, filling in defaults for missing values. */
  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  /** Persists the current settings to disk. */
  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
