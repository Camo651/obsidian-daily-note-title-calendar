# Daily Note Title Calendar

An [Obsidian](https://obsidian.md) plugin that turns a daily note's title into a rich, interactive date.

On any note whose file name matches your Daily Notes date format, the plugin hides the plain inline title and replaces it with a nicely formatted date. Clicking the date opens a calendar to jump to any day, and left/right arrows move to the previous/next day. Any day you navigate to is created on demand from your configured daily note template if it does not already exist.

## Features

- Renders the daily note's title as a formatted date (e.g. `Wednesday, October 14, 2026`).
- Click the date to open a month calendar and jump to any day.
- Previous / next day arrows for quick navigation.
- A calendar icon button jumps straight to today's note (shown when you are not already on today).
- A subtle "Today" chip above the title when viewing today's note.
- Navigating to a day that has no note yet creates it using the template configured in the core Daily Notes settings.
- Marks days that already have notes in the calendar, and highlights today and the current note's day.
- Works in both Live Preview / Source mode and Reading view, and across split panes.

## Requirements

- The core **Daily notes** plugin (or the **Periodic Notes** community plugin) must be enabled and configured with a date format, folder, and optionally a template.
- Obsidian's **Show inline title** setting (Settings → Appearance) must be enabled — that is the title this plugin hijacks.

## Installation

### From the Community Plugins browser

1. Open Settings → Community plugins → Browse.
2. Search for "Daily Note Title Calendar".
3. Install and enable it.

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest [release](https://github.com/Camo651/obsidian-daily-note-calendar/releases).
2. Copy them into your vault at `.obsidian/plugins/daily-note-title-calendar/`.
3. Reload Obsidian and enable the plugin under Settings → Community plugins.

### Beta testing with BRAT

Using the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin, add the beta plugin `Camo651/obsidian-daily-note-calendar`.

## Usage

1. Configure the core Daily Notes plugin (date format, folder, and template).
2. Open a daily note. Its title becomes the formatted date.
3. Click the date to open the calendar and jump to any day.
4. Use the arrows to move one day back or forward.
5. Use the calendar icon to return to today.

When you navigate to a day whose note does not exist yet, the plugin creates it in your Daily Notes folder using your configured template, then opens it.

## Settings

- **Show navigation arrows** — toggle the previous/next day arrows.
- **Show rich date title** — render the formatted date; when off, the raw file name is shown and the format option is disabled.
- **Show Today chip** — toggle the "Today" chip shown on today's note.
- **Title date format** — the [Moment.js](https://momentjs.com/docs/#/displaying/format/) format used for the title (e.g. `dddd, MMMM D, YYYY`).
- **Week starts on** — the first day of the week in the calendar (locale default, Sunday, Monday, or Saturday).

## Development

```bash
npm install
npm run dev    # watch build into ./dist
npm run build  # type-check and produce a production build in ./dist
```

The build outputs `main.js`, `manifest.json`, and `styles.css` into `./dist`, which is a ready-to-install plugin folder. Copy its contents into `.obsidian/plugins/daily-note-title-calendar/` in a test vault, or symlink it there.

## License

[MIT](LICENSE)
