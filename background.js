const DEFAULT_BREAKPOINT = 1400;
const DEFAULT_LAYOUT_WHEN_NARROW = "wide";
const DEFAULT_LAYOUT_WHEN_WIDE = "vertical";
const CHECK_ALARM = "layout-width-check";
const CHECK_PERIOD_MINUTES = 0.01;

let lastAppliedLayout = null;
let lastMeasuredWidth = null;

const ALLOWED_LAYOUTS = new Set(["standard", "wide", "vertical"]);

function pickLayoutByWidth(width) {
  if (typeof width !== "number") {
    return null;
  }
  const selectedLayout = width < DEFAULT_BREAKPOINT
    ? DEFAULT_LAYOUT_WHEN_NARROW
    : DEFAULT_LAYOUT_WHEN_WIDE;

  if (!ALLOWED_LAYOUTS.has(selectedLayout)) {
    return "standard";
  }

  return selectedLayout;
}

async function getTargetWindowState() {
  const allWindows = await messenger.windows.getAll({
    windowTypes: ["normal"],
  });

  const focusedNormal = allWindows.find((windowInfo) => windowInfo.focused);
  const candidate = focusedNormal ?? allWindows[0] ?? null;
  if (!candidate) {
    return null;
  }

  const activeMailTabs = await messenger.mailTabs.query({
    active: true,
    windowId: candidate.id,
  });
  const mailTabsInWindow = activeMailTabs.length > 0
    ? activeMailTabs
    : await messenger.mailTabs.query({ windowId: candidate.id });

  const targetMailTab = mailTabsInWindow[0] ?? null;
  const resolvedMailTabId = targetMailTab?.tabId ?? targetMailTab?.id ?? null;
  return {
    mailTabId: resolvedMailTabId,
    width: candidate.width ?? null,
  };
}

async function applyLayoutIfNeeded(reason) {
  const targetWindowState = await getTargetWindowState();
  const width = targetWindowState?.width ?? null;
  const mailTabId = targetWindowState?.mailTabId ?? null;

  if (width === null || mailTabId === null) {
    return;
  }

  const targetLayout = pickLayoutByWidth(width);
  if (!targetLayout) {
    return;
  }

  const widthChanged = width !== lastMeasuredWidth;
  const layoutChanged = targetLayout !== lastAppliedLayout;

  if (!widthChanged && !layoutChanged) {
    return;
  }

  try {
    await messenger.mailTabs.update(mailTabId, { layout: targetLayout });
  } catch (error) {
    console.debug("[auto-layout-switcher] could not apply layout", error);
    return;
  }

  lastMeasuredWidth = width;
  lastAppliedLayout = targetLayout;

  console.info(
    `[auto-layout-switcher] ${reason}: width=${width}, layout=${targetLayout}`,
  );
}

function schedulePeriodicCheck() {
  messenger.alarms.create(CHECK_ALARM, {
    periodInMinutes: CHECK_PERIOD_MINUTES,
  });
}

async function initialize() {
  schedulePeriodicCheck();
  await applyLayoutIfNeeded("startup");
}

messenger.windows.onCreated.addListener(() => {
  void applyLayoutIfNeeded("window-created");
});

messenger.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === messenger.windows.WINDOW_ID_NONE) {
    return;
  }
  void applyLayoutIfNeeded("focus-changed");
});

messenger.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== CHECK_ALARM) {
    return;
  }
  void applyLayoutIfNeeded("periodic-check");
});

void initialize();
