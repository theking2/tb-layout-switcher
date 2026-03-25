# Thunderbird Auto Layout Switcher

Automatically switches the Thunderbird mail layout between:

- `wide` when the focused main window is narrower than the breakpoint
- `vertical` when the focused main window is at or above the breakpoint

## Current behavior

- Breakpoint: `1400px`
- Poll interval: `30s` (via alarms)
- Trigger sources:
  - startup
  - window created
  - focus changed
  - periodic width check

## Load for local testing

1. Open Thunderbird.
2. Go to **Tools → Developer Tools → Debug Add-ons**.
3. Click **Load Temporary Add-on…**.
4. Pick `manifest.json` from this folder.

Then resize Thunderbird and the layout should switch automatically.

## Customize

In `background.js`, adjust:

- `DEFAULT_BREAKPOINT`
- `DEFAULT_LAYOUT_WHEN_NARROW`
- `DEFAULT_LAYOUT_WHEN_WIDE`
- `CHECK_PERIOD_MINUTES`


## Repo

You can find the repo on [github](https://github.com/theking2/tb-layout-switcher)