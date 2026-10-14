import { Notice, Plugin } from "obsidian";
import {
  DEFAULT_SETTINGS,
  DailyNoteCalendarSettings,
  DailyNoteCalendarSettingTab,
} from "./settings";
import { TitleDecorator } from "./titleDecorator";
import { dailyNotesReady } from "./dailyNotes";

export default class DailyNoteCalendarPlugin extends Plugin {
  settings!: DailyNoteCalendarSettings;
  decorator!: TitleDecorator;

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

  onunload(): void {
    this.decorator?.destroy();
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
