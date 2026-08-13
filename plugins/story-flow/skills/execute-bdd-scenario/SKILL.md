---
name: Execute BDD scenarios
description: Execute BDD test scenarios from .feature files using browser automation.
user-invocable: false
effort: medium
---

# Execute BDD scenarios

## Instructions

- Use `mcp__plugin_story-flow_playwright__*` tools to manipulate browser to EXECUTE the BDD scenarios directly without generating any Playwright test file.
- **Test Execution Protocol:**
  - **Before executing:** Read the feature file and confirm the exact line numbers, scenario title, background sections and all "Then" and "And" assertions.
  - **Execution order is CRITICAL:**
    1. **Scenario tags FIRST** (e.g., `@purge-data`)
    2. **Background steps SECOND** (setup prerequisites)
    3. **Scenario steps THIRD** (Given/When/Then)
  - **Execute all Background steps:** Background sections (both global and rule-specific) in feature files define prerequisite setup steps. **EVERY** step MUST be completed before executing the scenario steps, including both UI interactions and API calls by curl.
  - **During execution:** Compare actual behavior against expected behavior at each assertion step.
  - **On failure:** STOP immediately and provide a summary including:
    - Expected behavior (with line numbers from feature file)
    - Actual behavior (with evidence from page snapshot)
    - Root cause analysis
    - **CRITICAL: Do NOT continue to subsequent test steps after a failure**
- **Executing Multiple Scenarios:**
  When executing multiple scenarios (e.g., "Execute all scenarios in @path/to/file.feature", "Execute ARMR-01,ARMR-02 scenarios in @path/to/file.feature"):
  1. Read the feature file to identify all scenario IDs and titles
  2. For each scenario, use the **Task tool** with `subagent_type="general-purpose"` to run it in isolated context sequentially:
     ```
     Load BOTH skills in this order using the Skill tool:
     1. First: `story-flow:execute-bdd-scenario` (plugin - general BDD framework)
     2. Then: `execute-bdd-scenario` (project-level - overrides/extends the plugin)
     3. Confirm both skills are loaded before continuing with the execution.

     Execute BDD scenario <SCENARIO-ID> in @path/to/file.feature [--record if recording mode is active].
     ```
     **IMPORTANT:** Replace `<SCENARIO-ID>` with the individual scenario ID (e.g., `ARMR-01`), NOT "all". Each subagent executes exactly one scenario.
     **Recording Mode:** When executing multiple scenarios with `--record`, pass the `--record` flag to each subagent prompt. Each subagent is responsible for generating/updating the `.spec.js` file after executing its scenario — do NOT defer spec file generation to the parent orchestrator.
  3. Wait for subagent completion, record PASS/FAIL result
  4. **If the scenario FAILED:** STOP immediately and print the summary table with remaining scenarios marked as "⊘ SKIPPED". Do NOT proceed to the next scenario.
  5. Print summary table:
     ```
     | Scenario | Title | Result |
     |----------|-------|--------|
     | SMG-01   | Display available languages | ✓ PASSED |
     | SMG-02   | Search and filter strings   | ✗ FAILED |
     | SMG-03   | Inline edit a string value  | ⊘ SKIPPED |
     ```
- Save `.feature` files in the same folder as the stories.
- If a BDD scenario has the `@screenshots` tag, take one screenshot per **assertion group** — a maximal run of consecutive assertion steps with no action or wait step between them, since nothing re-renders in between — captured after the group's **last** UI assertion so every asserted condition has settled, and, in `--record` mode when VRT is configured, emit one visual regression tracking call per group (see [Visual Regression Testing (VRT)](#visual-regression-testing-vrt)). Command and polling assertion steps (S3/CLI/API checks) assert outside the viewport: they take no screenshot and do not break the group. Pass `browser_take_screenshot` a filename explicitly prefixed with `.playwright-mcp/` — e.g. `.playwright-mcp/SMG-01-i-should-see-the-dashboard.png` so it lands in the `.playwright-mcp` output folder — never an absolute path, which writes to the project root.
- If a BDD scenario doesn't have the `@screenshots` tag, do not take any screenshot.
- If a BDD scenario has the `@purge-data` tag, restore the seed data first (before the Background steps) by executing the `make reseed` command.
- If a BDD scenario does not have the `@purge-data` tag, do not restore the seed data before running the scenario.
- If a BDD scenario has the `@timeout-*` tag, extend the scenario and expect timeout to be longer. e.g. `@timeout-600s` means timeout for the scenario and every expect step is 600s(10m).
- Use `mcp__plugin_story-flow_playwright__browser_run_code_unsafe` to set the browser offline.
- Reference the @Makefile for local development workflows.
- Navigate relative to the base URL from `BASE_URL`, falling back to `use.baseURL` in the project's @playwright.config.js. Never hardcode a host.

## Mobile App Instructions

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APPIUM_DEVICE_NAME` | Local device name or emulator | `emulator-5554` |
| `APPIUM_APP_PACKAGE` | Local app package unique identifier | - |
| `BROWSERSTACK_USERNAME` | BrowserStack username | - |
| `BROWSERSTACK_ACCESS_KEY` | BrowserStack access key | - |
| `BROWSERSTACK_APP_ID` | Uploaded app ID (`bs://...`) | - |

**Mode detection**: When all 3 BrowserStack variables are set, use BrowserStack. Otherwise, use local Appium.

### Local Appium Configuration (Default)

Start Appium server: `npx appium server --port 4723`

WebdriverIO options:
```javascript
{
  hostname: "localhost",
  port: 4723,
  waitforTimeout: 30000,
  waitforInterval: 500,
  connectionRetryTimeout: 30000,
  connectionRetryCount: 3,
  capabilities: {
    platformName: "Android",
    "appium:deviceName": process.env.APPIUM_DEVICE_NAME || "emulator-5554",
    "appium:automationName": "UiAutomator2",
    "appium:appPackage": process.env.APPIUM_APP_PACKAGE,
    "appium:appActivity": ".MainActivity",
    "appium:autoGrantPermissions": true,
    "appium:noReset": true,
    "appium:fullReset": false,
  },
}
```

### BrowserStack Configuration

When all 3 BrowserStack env vars are set, connect to BrowserStack cloud instead of local Appium.
Start BrowserStackLocal binary before running tests. Stop BrowserStackLocal after tests complete. Use the WebDriver REST API directly by curl instead of Appium MCP or WebDriverIO library. 

WebdriverIO options:
```javascript
{
  hostname: "hub-cloud.browserstack.com",
  port: 443,
  protocol: "https",
  path: "/wd/hub",
  waitforTimeout: 30000,
  waitforInterval: 500,
  connectionRetryTimeout: 60000,
  connectionRetryCount: 3,
  capabilities: {
    "bstack:options": {
      buildName: ${featureName},
      sessionName: ${scenarioName},
      deviceName: "Google Pixel 9",
      osVersion: "16",
      userName: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
      local: true,  // Enable tunnel for localhost access
    },
    platformName: "Android",
    "appium:app": process.env.BROWSERSTACK_APP_ID,
    "appium:automationName": "UiAutomator2",
  },
}
```

### Execution Guidelines

- Use `mcp__plugin_story-flow_appium__*` tools or WebDriver REST API to manipulate mobile app to EXECUTE the BDD scenarios directly without generating any Playwright test file.
- Save Appium screenshots to `.appium-mcp` folder using absolute paths (e.g., `/path/to/project/.appium-mcp/screenshot.png`). The Appium MCP tool does not support relative paths.
- **Page source vs screenshots:**
  - **Use page source XML** (via `appium_get_page_source` or REST API) for:
    - Verifying element presence, text content, and attributes
    - Waiting for elements to appear or disappear. Leverage WebDriverIO `waitForDisplayed`, `waitForEnabled`, `waitForExist`, `waitForClickable` and `waitUntil`.
      - **Default timeout**: Call these methods WITHOUT explicit timeout parameters - they use `waitforTimeout` from appiumOptions (default: 30000ms)
      - **Custom timeout**: Only add explicit `{ timeout: X }` when an operation is known to take longer than the default (e.g., network fetches, large file operations)
      - Example:
        ```javascript
        // CORRECT - uses default waitforTimeout (30s)
        await element.waitForDisplayed();

        // CORRECT - custom timeout for slow operation
        await slowNetworkElement.waitForDisplayed({ timeout: 60000 });

        // WRONG - redundant timeout same as default
        await element.waitForDisplayed({ timeout: 30000 });
        ```
    - Finding element bounds for tap coordinates
    - All non-visual verification steps
  - **Only use screenshots** for:
    - Visual verification (e.g., verifying colors with ImageMagick)
    - After the last UI assertion of each assertion group, when the scenario has the `@screenshots` tag
  - Page source is faster and provides structured data; screenshots are only needed when pixel-level visual verification is required.
- **Multi-finger gestures (3-finger tap, pinch, etc.):**
  - The Appium MCP tools don't have direct multi-finger support, so use the W3C Actions API via HTTP.

## Visual Regression Testing (VRT)

Visual regression compares each screenshot against an approved baseline in a self-hosted [Visual Regression Tracker (VRT)](https://github.com/Visual-Regression-Tracker/Visual-Regression-Tracker) instance, which provides a web UI for approve/reject. This is wired **only into `--record` mode** — the generated Playwright spec calls the VRT SDK natively. Direct (non-record) execution is unaffected: `@screenshots` captures the same per-assertion-group set, just untracked.

**Provisioning is out of scope for this plugin.** Standing up the VRT stack (Docker, ports, creating the project and API key) is the consuming project's responsibility. The skill assumes VRT is reachable whenever the `VRT_*` env vars are set — the same way it assumes a BrowserStack account exists when `BROWSERSTACK_*` is set.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VRT_APIURL` | VRT backend API URL | `http://localhost:4200` |
| `VRT_PROJECT` | VRT project name or ID | - |
| `VRT_APIKEY` | VRT user API key | - |
| `VRT_BRANCHNAME` | Baseline branch | Current git branch |
| `VRT_CIBUILDID` | Groups every worker's `start()` into one VRT build | Current git SHA |
| `VRT_ENABLESOFTASSERT` | `true` = collect diffs without throwing; review in UI | `true` |

**Build scope**: one build per commit, not per feature file. The VRT backend upserts a build on (project, `ciBuildId`), so defaulting `VRT_CIBUILDID` to the current git SHA makes every Playwright worker's `start()` resolve to the same build. Re-running the suite on the same commit appends to that commit's build — set `VRT_CIBUILDID` explicitly (e.g. a CI run id) when each re-run needs its own.

**Mode detection**: When running with `--record` **and** `VRT_APIURL`, `VRT_APIKEY`, and `VRT_PROJECT` are all set, the generated spec for a `@screenshots` scenario tracks each screenshot in VRT. Otherwise (no `--record`, or any of the three unset), `@screenshots` captures screenshots only. The `@visual-regression-tracker/agent-playwright` SDK reads the `VRT_*` variables natively, so generated specs carry no inline credentials.

**Run-time detection**: Record-time config controls whether VRT wiring is *emitted*; the env vars control whether it *runs*. The generated spec re-checks `VRT_APIURL`, `VRT_APIKEY`, `VRT_PROJECT`, and `VRT_BRANCHNAME` at run time via an `isVrtEnabled` flag (see [VRT wiring](#generating-the-spec-file)), so a spec recorded with VRT configured degrades to screenshot-only on machines and CI jobs without those vars instead of failing the suite.

**Soft-assert default**: Default `VRT_ENABLESOFTASSERT` to `true` so diffs are collected for review rather than hard-failing the test — the safer default given a human approval step and unavoidable first-run "new image" states.

- `VRT_ENABLESOFTASSERT=true` (default): diffs do not fail the test; a human approves/rejects in the UI. Covers first runs / baseline establishment cleanly.
- `VRT_ENABLESOFTASSERT=false` (opt-in strict mode): a new/unapproved/changed image fails the test, and the failure includes the VRT diff link.

**IMPORTANT:** The VRT SDK's own native default for soft-assert is `false`. When `VRT_ENABLESOFTASSERT` is unset, the generated spec MUST set it explicitly to `true` — do not rely on the SDK default.

**First run / approval flow**: Images with no baseline appear as "new" in the VRT UI. Approving them creates the baseline, keyed by Project + Name + Branch + OS + Browser + Viewport + Device + Custom Tags — so `name` must be reproducible across recordings, otherwise a re-record orphans the approved baseline and shows up as a spurious "new" image. The key has no environment dimension, so give each environment its own `VRT_PROJECT`.

### Screenshot Options

Every tracked image is captured with `animations: 'disabled'`. The helpers apply it (see [VRT wiring](#generating-the-spec-file)), so it is never spelled out per call.

**IMPORTANT:** The SDK forwards `screenshotOptions` to Playwright's `page.screenshot()`, **not** `toHaveScreenshot()`. `page.screenshot()` defaults to `animations: 'allow'`; only `toHaveScreenshot()` flips it to `'disabled'`. Since VRT bypasses `toHaveScreenshot`, the comparison-safe default is not inherited and MUST be set explicitly — the same trap as `VRT_ENABLESOFTASSERT` above.

- **Why it matters**: without it, a shot taken mid-transition captures an arbitrary frame. The approved baseline becomes one random frame of a fade, and every later run diffs against it.
- **What `animations: 'disabled'` does**: finite CSS animations, CSS transitions, and Web Animations are fast-forwarded to their end state (so `transitionend` fires); infinite ones are cancelled to their initial state and resumed after the shot.
- **What it does NOT freeze**: `<video>`, animated GIF/APNG, canvas/WebGL, and JS animations driven by `requestAnimationFrame`/`setTimeout` rather than the Web Animations API. Exclude those regions with `ignoreAreas`.
- **Element shots**: `trackElementHandle` takes the same options via `elementHandle.screenshot()`, so `trackVisualElement` gets the same default.

Anything passed as `screenshotOptions` in a `[RECORD_VISUAL]` annotation merges **over** this default, so `{ fullPage: true }` still captures with animations disabled. Only an explicit `{ animations: 'allow' }` overrides it.

## Recording Mode (--record flag)

When the `--record` flag is present in the input, generate a Playwright `.spec.js` file after executing **every** scenario by recording actions and expectations during execution.

### Recording Feature and Scenario Tags

When recording, capture both feature-level tags (above the `Feature:` line) and scenario-level tags. Output them BEFORE recording any other steps (including Background):

```
[RECORD_TAG]
scenario: "DAS-01: Finish onboarding"
featureTags: ["@e2e", "@auth"]
tags: ["@purge-data"]
[/RECORD_TAG]
```

**Annotation fields:**
- `scenario`: The scenario ID and title
- `featureTags`: Feature-level tags (above the `Feature:` line) — inherited by all scenarios in the file. Empty array `[]` when the feature has no tags.
- `tags`: Scenario-level tags applied only to this scenario.

**Example: Feature with @e2e @auth and scenario with @purge-data**

Feature file:
```gherkin
@e2e @auth
Feature: App Settings

  Background:
    Given I extract appId from S3
    And I set localStorage

  @purge-data
  Scenario: DAS-01: Finish onboarding
    Given I am on the onboarding page
```

Recording output:
```
[RECORD_TAG]
scenario: "DAS-01: Finish onboarding"
featureTags: ["@e2e", "@auth"]
tags: ["@purge-data"]
[/RECORD_TAG]
```

Generated Playwright code (note: feature tags precede scenario tags in the test name; tag action comes BEFORE Background helper call):
```javascript
test('DAS-01: Finish onboarding @e2e @auth @purge-data', async ({ page, context, baseURL }) => {
  // @purge-data - Restore the seed data to initial state (runs FIRST)
  execSync('make reseed', { stdio: 'inherit' });

  // Background (runs SECOND)
  await setupBackground(context, baseURL);

  // Scenario steps (runs THIRD)
  // Given I am on the onboarding page
  await page.goto('/onboarding');
});
```

### Recording Background Steps as Helper Functions

Background steps are converted to **reusable helper functions** at the top of the generated spec file. This eliminates code duplication and makes tests self-contained.

**CRITICAL:** When recording, you MUST:
1. Record scenario tags FIRST (if any)
2. Record ALL Background steps using `[RECORD_HELPER]` annotation
3. Each Background step becomes either a standalone helper or part of a composite helper
4. Follow the same order as they appear in the feature file

### `[RECORD_HELPER]` Annotation Format

When recording Background steps, output a helper function definition:

```
[RECORD_HELPER]
name: extractAppIdFromS3
params: []
returns: "string"
body: |
  const output = execSync(
    `aws --endpoint-url=${process.env.S3_ENDPOINT} s3 ls s3://apps/`,
    { encoding: "utf-8" }
  );
  return output.match(/PRE ([a-f0-9-]{36})\//)?.[1] ?? "";
[/RECORD_HELPER]
```

**Annotation fields:**
- `name`: Function name (camelCase, descriptive)
- `params`: Array of typed parameters (e.g., `["context: BrowserContext", "appId: string"]`) — the types are metadata; the generated JavaScript emits names only: `async function setupBackground(context, appId)`
- `returns`: Return type (e.g., `"string"`, `"Promise<void>"`, `"Promise<string>"`) — not emitted either; it signals whether to `await` the call and capture its value
- `body`: The function implementation (multiline supported)

### Composite vs Granular Helpers

**Create composite helpers** when multiple Background steps work together:

```
[RECORD_HELPER]
name: setupBackground
params: ["context: BrowserContext"]
returns: "Promise<string>"
body: |
  const appId = extractAppIdFromS3();
  await setLocalStorageAppId(context, appId);
  await setCookies(context);
  return appId;
[/RECORD_HELPER]
```

**Guidelines:**
- Granular helpers: Individual reusable operations (e.g., `extractAppIdFromS3`, `setCookies`)
- Composite helpers: Combine granular helpers for common setup patterns (e.g., `setupBackground`)
- If a scenario needs a value from Background (e.g., `appId`), the composite helper should return it

### Recording Dynamic Value Extraction

When a Background step extracts a value (e.g., appId from S3), create a helper that returns the value:

```
[RECORD_HELPER]
name: extractAppIdFromS3
params: []
returns: "string"
body: |
  const output = execSync(
    `aws --endpoint-url=${process.env.S3_ENDPOINT} s3 ls s3://apps/`,
    { encoding: "utf-8" }
  );
  return output.match(/PRE ([a-f0-9-]{36})\//)?.[1] ?? "";
[/RECORD_HELPER]
```

The value is then available in the test via the composite helper's return value:

```javascript
test('DAS-02: Delete image', async ({ page, context }) => {
  // Background (returns appId for use in scenario)
  const appId = await setupBackground(context);

  // Scenario steps can now use appId...
});
```

### Recording Actions (Given/When steps)

After each action step, output a structured annotation.

**Before recording the `locator` field:** Discover the element's scoped locator chain by evaluating its ancestors in the UI hierarchy (see Locator Strategies). No exceptions — even if you already know the element's data-testid, you must discover its full ancestor chain to build the scoped locator.
**CRITICAL:** After discovering the scoped locator chain, you MUST use ALL entries in the chain for the `locator` field. e.g. If the chain returns:
  `[{ testid: "ShareButton" }, { testid: "Container" }]`
Then the locator MUST be:
  `page.getByTestId('Container').getByTestId('ShareButton')`
NOT:
  `page.getByTestId('ShareButton')`

```
[RECORD_ACTION]
step: "When I click the \"Cancel\" button in the dialog"
method: click
locator: page.getByRole('dialog').getByRole('button', { name: 'Cancel' })
[/RECORD_ACTION]
```

**Annotation fields:**
- `step`: The exact Gherkin step text (becomes a comment in generated code)
- `method`: The Playwright action method
- `locator`: The Playwright locator used to find the element
- `value`: For fill/type/evaluate actions (optional)
- `extract`: Variable name to store extracted value (for execSync)
- `pattern`: Regex pattern to extract value from output (for execSync)
- `args`: Array of arguments to pass to evaluate function (for evaluate with args)

**Handling Ordinal Qualifiers:**

When BDD steps contain ordinal words (first, second, third, last), include the appropriate Playwright method directly in the `locator` field:

| Ordinal Word | Append to Locator |
|--------------|-------------------|
| first | `.first()` |
| second | `.nth(1)` |
| third | `.nth(2)` |
| last | `.last()` |

Example - BDD step with "first":
```gherkin
And I click the close icon button on the first image
```

Recording output:
```
[RECORD_ACTION]
step: "And I click the close icon button on the first image"
method: click
locator: page.getByTestId('Images').getByTestId('DeleteButton').first()
[/RECORD_ACTION]
```

When a BDD step contains an ordinal qualifier, you MUST append the corresponding method to the locator to avoid strict mode violations.

**Recording URLs:**

Record `goto`, `waitForURL` and `toHaveURL` values as a **path** (`/settings`), never an absolute URL — they resolve against `use.baseURL` in the project's playwright.config.js, so one spec runs against any environment. Keep an absolute URL only when the step deliberately leaves the application's origin, e.g. an external identity provider.

**Supported action methods:**

| method | Generated Code |
|--------|----------------|
| `goto` | `await page.goto(value)` |
| `click` | `await locator.click()` |
| `fill` | `await locator.fill(value)` |
| `type` | `await locator.pressSequentially(value)` |
| `selectOption` | `await locator.selectOption(value)` |
| `check` | `await locator.check()` |
| `uncheck` | `await locator.uncheck()` |
| `evaluate` | `await page.evaluate(value)` or `await page.evaluate(value, ...args)` |
| `execSync` | `const output = execSync(value, { encoding: 'utf-8' }); extract = output.match(pattern)?.[1]` |
| `setInputFiles` | `await locator.setInputFiles(value)` |
| `keyboardPress` | `await page.keyboard.press(value)` |
| `keyboardDown` | `await page.keyboard.down(value)` |
| `keyboardUp` | `await page.keyboard.up(value)` |
| `waitFor` | `await locator.waitFor()` |
| `waitForURL` | `await page.waitForURL(value)` |
| `waitForLoadState` | `await page.waitForLoadState(value)` |

### Recording Expectations (Then/And assertion steps)

After verifying each assertion step, output a structured annotation.

**Before recording the `locator` field:** Discover the element's scoped locator chain by evaluating its ancestors in the UI hierarchy (see Locator Strategies). No exceptions — even if you already know the element's data-testid, you must discover its full ancestor chain to build the scoped locator.
**CRITICAL:** After discovering the scoped locator chain, you MUST use ALL entries in the chain for the `locator` field. e.g. If the chain returns:
  `[{ testid: "ShareButton" }, { testid: "Container" }]`
Then the locator MUST be:
  `page.getByTestId('Container').getByTestId('ShareButton')`
NOT:
  `page.getByTestId('ShareButton')`

```
[RECORD_EXPECT]
step: "Then I should see 3 images in the product section"
locator: page.getByTestId('Products').getByTestId('Product').locator('img')
assertion: toHaveCount
value: 3
[/RECORD_EXPECT]
```

**Annotation fields:**
- `step`: The exact Gherkin step text (becomes a comment)
- `locator`: The Playwright locator used to find the element
- `assertion`: The Playwright assertion method
- `value`: The expected value (optional, depends on assertion type)

**Supported assertions:**

| assertion | Generated Code |
|-----------|----------------|
| `toBeVisible` | `await expect(locator).toBeVisible()` |
| `toBeHidden` | `await expect(locator).toBeHidden()` |
| `toHaveCount` | `await expect(locator).toHaveCount(value)` |
| `toHaveText` | `await expect(locator).toHaveText(value)` |
| `toContainText` | `await expect(locator).toContainText(value)` |
| `toHaveValue` | `await expect(locator).toHaveValue(value)` |
| `toBeEnabled` | `await expect(locator).toBeEnabled()` |
| `toBeDisabled` | `await expect(locator).toBeDisabled()` |
| `toHaveURL` | `await expect(page).toHaveURL(value)` |
| `toHaveAttribute` | `await expect(locator).toHaveAttribute(name, value)` |
| `evaluate` | `const ret = await locator.evaluate(func)` |

### Recording Visual Regression (VRT)

Only applies when the scenario has the `@screenshots` tag AND VRT is configured at record time (see [Visual Regression Testing (VRT)](#visual-regression-testing-vrt)). The generated calls are additionally guarded at run time, so they no-op when the `VRT_*` env vars are absent. Output one `[RECORD_VISUAL]` annotation per assertion group per target — the same set direct execution captures — placed AFTER the group's **last** UI assertion's `[RECORD_EXPECT]` annotation so the tracking call lands once the whole group has settled:

```
[RECORD_VISUAL]
step: "Then I should see the dashboard"
name: "SMG-01-i-should-see-the-dashboard"
target: page
options: { diffTollerancePercent: 1 }
[/RECORD_VISUAL]
```

**Annotation fields:**
- `step`: The exact Gherkin step text (becomes a comment) — the group's **last** UI assertion step, the same step the shot is captured after, so the recorded `name` stays derivable from it
- `name`: **Derived, never invented** — see [Deriving the VRT name](#deriving-the-vrt-name) below
- `target`: `page` for a full-page shot (→ `trackPage`), or a discovered scoped locator for an element shot (→ `trackElementHandle`). Default to `page`; use a locator only when the assertion is scoped to one element and a full-page shot would be noisy. Discover the locator chain per the [Locator Strategies](#locator-strategies) rules — no fabricated selectors. Element shots are **not** collapsed into the group's page shot: each distinct target is a different image, so a group containing element-scoped assertions emits one annotation per target, each recording its own step.
- `options`: Optional VRT options object — `diffTollerancePercent`, `ignoreAreas`, `screenshotOptions`, `agent`. `screenshotOptions` merges over the helpers' `animations: 'disabled'` default rather than replacing it, so only record it when a shot needs something extra (e.g. `fullPage`) — see [Screenshot Options](#screenshot-options).

**Supported tracking calls:**

| target | Generated Code |
|--------|----------------|
| `page` | `await trackVisualPage(page, name, options)` |
| locator | `await trackVisualElement(locator, name, options)` |

Both are run-time-guarded helpers defined at the top of the spec, not direct SDK calls — see [VRT wiring](#generating-the-spec-file).

#### Deriving the VRT name

`name` is part of VRT's baseline key, so it MUST be reproducible: recording the same scenario twice has to produce byte-identical names, or the approved baseline is orphaned. Never coin a short label — derive it mechanically:

```
<scenario-id>[-<row-key>]-<step-slug>[-<n>]
```

- **`<scenario-id>`** — verbatim from the feature file, keeping its original casing so it matches the generated `test('SMG-01: …')` name. Only the step text is lowercased.
- **`[-<row-key>]`** — present only for a `Scenario Outline`; see [Scenario Outline rows](#scenario-outline-rows) below.
- **`<step-slug>`** — slugify the `step` value:
  1. Drop the leading Gherkin keyword (`Given` / `When` / `Then` / `And` / `But`).
  2. Lowercase the remainder.
  3. Replace every run of non-alphanumeric characters with a single `-`, then trim leading and trailing `-`.
  4. Truncate to 80 characters at a `-` boundary. VRT imposes no length limit on `name` — this cap exists only to keep names readable in the VRT UI.
- **`[-<n>]`** — append `-2`, `-3`, … **only** when an identical name was already emitted within the same scenario (and, for an outline, the same row), numbered in emission order. Do not add a positional step index otherwise: it would shift whenever a step is inserted or reordered and orphan every downstream baseline.

##### Scenario Outline rows

Each `Examples:` row renders a different image, so every row needs its own name — rows sharing one name collide on a single baseline and flip it back and forth on every run. VRT's `customTags` variant dimension is not reachable through `@visual-regression-tracker/agent-playwright`, so the row must be distinguished inside `name`:

- Take the placeholders that appear in the **`Scenario Outline:` title**, in the order they appear there, and slugify that row's values for them. That is the row key. Placeholders appearing only in steps or only in `Examples:` are deliberately excluded — the title is the author's declaration of what distinguishes the rows.
- **Fallback:** when the outline title contains no placeholders, use `row-1`, `row-2`, … in `Examples:` row order (header excluded). This fallback is positional — inserting or reordering rows orphans the affected baselines — so prefer putting the discriminating placeholder in the outline title.
- Slugify the step text **after** placeholder substitution, matching what `step` records at execution time. If a step's text also contains the title's placeholder, the value simply appears twice in the name; that is harmless and not special-cased.

```gherkin
Scenario Outline: SMG-01 Dashboard for <role>
  Given I log in as "<role>" with locale "<locale>"
  Then I should see the dashboard

  Examples:
    | role  | locale | notes       |
    | admin | en-US  | full access |
    | guest | ja-JP  | read only   |
```

```
SMG-01-admin-i-should-see-the-dashboard
SMG-01-guest-i-should-see-the-dashboard
```

`locale` and `notes` are excluded because they do not appear in the title.

### Recording Command Line Executions

For steps that require command line verification (e.g., S3 state checks), output:

```
[RECORD_COMMAND]
step: "And the image should be deleted from S3 bucket"
command: aws --endpoint-url=${process.env.S3_ENDPOINT} s3 ls s3://apps/${appId}/assets/image.png
assertion: shouldFail
[/RECORD_COMMAND]
```

**Annotation fields:**
- `step`: The exact Gherkin step text
- `command`: The shell command to execute
- `assertion`: Either `shouldSucceed` (command exits 0) or `shouldFail` (command exits non-zero)
- `pattern`: Optional regex pattern to match in output

**Supported command assertions:**

| assertion | Generated Code |
|-----------|----------------|
| `shouldSucceed` | `expect(() => execSync(command)).not.toThrow()` |
| `shouldFail` | `expect(() => execSync(command)).toThrow()` |
| `outputContains` | `expect(execSync(command, { encoding: "utf-8" })).toContain(pattern)` |
| `outputMatches` | `expect(execSync(command, { encoding: "utf-8" })).toMatch(pattern)` |

**Shell Path Quoting:**

When generating shell commands with file paths, **always quote local file paths** that may contain special shell characters (parentheses, spaces, `$`, etc.):

```javascript
// WRONG - parentheses interpreted as subshell syntax
execSync(`aws s3 cp ${fixturePath}.png s3://bucket/...`);

// CORRECT - quoted path prevents shell interpretation
execSync(`aws s3 cp "${fixturePath}.png" s3://bucket/...`);
```

Common paths requiring quotes:
- Next.js route groups: `src/app/(app)/...`
- Paths with spaces: `src/My Documents/...`
- Paths with special chars: `src/feature[1]/...`

### Recording Mobile Screenshot Color Verification

For mobile app scenarios that verify UI colors via screenshots, use `[RECORD_COMMAND]` with ImageMagick. The generated spec file uses WebdriverIO with Appium.

**Recording annotation:**
```
[RECORD_COMMAND]
step: "Then the \"Login\" button should have background in the primary color \"#9933FF\""
command: magick "${imagePath}" -crop 1x1+150+2110 txt:- | tail -1
assertion: outputContains
pattern: "#9933FF"
[/RECORD_COMMAND]
```

**Generated imports and setup:**
```javascript
import { test, expect } from '@playwright/test';
import { remote } from 'webdriverio';
import { execSync } from 'child_process';
import path from 'path';

function getAppiumOptions() {
  const { BROWSERSTACK_USERNAME, BROWSERSTACK_ACCESS_KEY, BROWSERSTACK_APP_ID } = process.env;
  const useBrowserStack = BROWSERSTACK_USERNAME && BROWSERSTACK_ACCESS_KEY && BROWSERSTACK_APP_ID;

  if (useBrowserStack) {
    return {
      // See "BrowserStack Configuration" section
    };
  }

  return {
    // See "Local Appium Configuration" section
  };
}
```

**Generated helper functions:**
```javascript
async function takeAppScreenshot(driver, filename) {
  const imagePath = path.join(process.cwd(), '.appium-mcp', filename);
  await driver.saveScreenshot(imagePath);
  return imagePath;
}

function verifyColorAtPixel(imagePath, x, y, expectedColor) {
  const output = execSync(
    `magick '${imagePath}' -crop 1x1+${x}+${y} txt:- | tail -1`,
    { encoding: 'utf-8' }
  );
  if (!output.toUpperCase().includes(expectedColor.toUpperCase())) {
    throw new Error(`Expected color ${expectedColor} at (${x},${y}), got: ${output.trim()}`);
  }
}
```

**Generated test code:**
```javascript
const driver = await remote(getAppiumOptions());

// Take screenshot for color verification
const imagePath = await takeAppScreenshot(driver, "color-verification.png");

// Then the "Login" button should have background in the primary color "#9933FF"
verifyColorAtPixel(imagePath, 150, 2110, "#9933FF");

await driver.deleteSession();
```

**ImageMagick crop syntax:** `-crop 1x1+X+Y` extracts a single pixel at coordinates (X, Y).

**Finding pixel coordinates during execution:**
1. Take a screenshot using Appium MCP: `appium_take_screenshot`
2. Get image dimensions: `magick identify image.png`
3. Estimate element position based on screen layout
4. Sample pixels to find the target color: `magick image.png -crop 1x1+X+Y txt:- | tail -1`

### Recording Wait Strategies

When the page needs to wait for async operations (e.g., after navigation, after platform change), output:

```
[RECORD_WAIT]
step: "Wait for page content to load"
method: waitForLoadState
value: "networkidle"
[/RECORD_WAIT]
```

**Annotation fields:**
- `step`: Description of what is being waited for
- `method`: The Playwright wait method
- `value`: The wait condition or selector

**Supported wait methods:**

| method | Generated Code |
|--------|----------------|
| `waitForLoadState` | `await page.waitForLoadState(value)` |
| `waitForSelector` | `await page.waitForSelector(value)` |
| `waitForFunction` | `await page.waitForFunction(value)` |

**When to record waits:**
- After `page.goto()` when waiting for dynamic content
- After actions that trigger server requests (platform change, form submit)
- Before assertions on dynamically loaded content

**DO NOT use `waitForTimeout`** - if you find yourself needing a hardcoded wait, use `waitForLoadState('networkidle')` or wait for a specific element/assertion instead.

### Recording Polling Assertions

For steps that require waiting for eventual consistency (S3 state, API responses), use Playwright's `expect.poll()`:

**When to use polling:**
- S3 bucket state verification after async operations
- API state changes with eventual consistency
- Backend operations that don't complete immediately

**Recording annotation:**
```
[RECORD_POLL]
step: "And I wait until \"name\" is \"John\" in S3"
command: aws --endpoint-url=${process.env.S3_ENDPOINT} s3 cp s3://apps/${appId}/user.json -
key: name
assertion: toBe
value: "John"
[/RECORD_POLL]
```

**Annotation fields:**
- `step`: The exact Gherkin step text
- `command`: The shell command to execute (should return JSON)
- `key`: JSON property to check (supports dot notation, e.g., `user.name`)
- `assertion`: The Playwright assertion method
- `value`: The expected value

**Generated Playwright code:**
```javascript
// Helper function (add to helpers section if not present)
function getS3User(appId) {
  try {
    const output = execSync(
      `aws --endpoint-url=${process.env.S3_ENDPOINT} s3 cp s3://apps/${appId}/user.json - 2>/dev/null`,
      { encoding: "utf-8" }
    );
    return JSON.parse(output);
  } catch {
    return {};
  }
}

// In test - check specific key
await expect.poll(() => getS3User(appId).name).toBe("John");
```

**Supported polling assertions:**

| assertion | Generated Code |
|-----------|----------------|
| `toBe` | `await expect.poll(() => getS3User(appId).key).toBe(value)` |
| `toEqual` | `await expect.poll(() => getS3User(appId).key).toEqual(value)` |
| `toContain` | `await expect.poll(() => getS3User(appId).key).toContain(value)` |
| `toMatch` | `await expect.poll(() => getS3User(appId).key).toMatch(pattern)` |

### MUI Component Handling

**MUI Select/Combobox:**
- MUI Select components use `role="combobox"` but are NOT actual `<input>` elements
- `toHaveValue()` will fail on combobox elements with "Not an input element" error
- Use `toContainText()` to verify the selected value:
  ```javascript
  // WRONG - will fail (combobox is not an <input>)
  await expect(page.getByRole('combobox', { name: 'Country' })).toHaveValue('US');

  // CORRECT - check displayed text
  await expect(page.getByRole('combobox', { name: 'Country' })).toContainText('United States');
  ```

**MUI DataGrid Column Index:**
- Column headers have `aria-colindex` attribute (1-based index)
- Grid cells have `data-colindex` attribute (0-based index) and `data-field` attribute (field name)
- To verify column position or adjacency:
  ```javascript
  // Get column index by field name
  const stateIndex = await page.locator('[data-field="state"]').first()
    .getAttribute('data-colindex');

  // Verify adjacent columns
  const countryIdx = await page.locator('[data-field="country"]').first().getAttribute('data-colindex');
  expect(parseInt(stateIndex)).toBe(parseInt(countryIdx) + 1);
  ```

### Navigation Handling

**Waiting for URL redirections:**
- When asserting URL changes after actions that trigger navigation (e.g., form submissions, button clicks that redirect), use `waitForURL` before the assertion:
  ```javascript
  // Wait for navigation to complete before asserting
  await page.waitForURL(/\/landing/);
  await expect(page).toHaveURL(/\/landing/);
  ```
- For recording mode, output:
  ```
  [RECORD_ACTION]
  step: "Verify redirect to landing page"
  method: waitForURL
  value: /\/landing/
  [/RECORD_ACTION]
  ```

### Waiting Strategies

**CRITICAL: Never use `waitForTimeout()` in generated code.** Hardcoded waits are anti-patterns that make tests slow and flaky.

**Instead, use these Playwright waiting strategies:**

| Scenario | Solution | Example |
|----------|----------|---------|
| Wait for page load | `waitForLoadState` | `await page.waitForLoadState('networkidle')` |
| Wait for element | Assertion with auto-retry | `await expect(locator).toBeVisible()` |
| Wait for dynamic content | `waitForSelector` | `await page.waitForSelector('[alt^="image"]')` |
| Wait after navigation | `waitForURL` + `waitForLoadState` | See below |

**Pattern for page navigation with dynamic content:**
```javascript
// WRONG - hardcoded wait
await page.goto("/settings");
await page.waitForTimeout(2000);

// CORRECT - wait for network to settle
await page.goto("/settings");
await page.waitForLoadState("networkidle");

// BEST - wait for specific content you need
await page.goto("/settings");
await expect(page.locator('[alt^="image"]')).toHaveCount(3);
```

**Pattern for actions that trigger async operations:**
```javascript
// WRONG
await page.getByRole("combobox", { name: "Country" }).click();
await page.getByRole("option", { name: "United States" }).click();
await page.waitForTimeout(2000);

// CORRECT - wait for the result of the action
await page.getByRole("combobox", { name: "Country" }).click();
await page.getByRole("option", { name: "United States" }).click();
await page.waitForLoadState("networkidle");
```

### Locator Strategies

**NEVER fabricate or assume selectors.** Always discover actual selectors from the page snapshot or via JavaScript evaluation before recording.

#### Web (Playwright)

Use Playwright's preferred locator strategies in order of preference:
1. `page.getByTestId('OnboardingContainer').getByTestId('OnboardingPrimaryColor')` - scoped by parent testids to avoid ambiguity
2. `page.getByTestId('OnboardingPrimaryColor')` - **ALWAYS check for data-testid first**
3. `page.locator('[data-slot="sidebar-overlay"]')` - for other data attributes
4. `page.getByRole('button', { name: 'Submit' })` - for semantic elements
5. `page.getByLabel('Name')` - for form fields
6. `page.getByPlaceholder('Enter name')` - for placeholder text
7. `page.getByText('Error message')` - for text content
8. `page.locator('.class-name')` - fallback for CSS selectors

**Discovering testids via JavaScript evaluation:**

Playwright's accessibility snapshot does NOT show `data-testid` attributes. Use JavaScript evaluation to discover testids for the specific element you're interacting with — this applies to **both actions and expectations**.

1. **Find testid for a specific element** using `browser_evaluate` with the element ref:
   ```javascript
   (element) => {
     // Walk up DOM tree to find testid chain
     let el = element;
     const chain = [];
     while (el && el !== document.body) {
       const testid = el.getAttribute('data-testid');
       if (testid) {
         chain.push({ testid, tag: el.tagName.toLowerCase() });
       }
       el = el.parentElement;
     }
     return chain;
   }
   ```

2. **Use the testid chain to build scoped locators:**
   ```
   # Example: clicking delete button in product section
   # Snapshot shows: [S42] button "delete"
   # JavaScript returns: [
   #   { testid: "DeleteButton", tag: "button" },
   #   { testid: "Product", tag: "div" }
   # ]

   # Generated locator:
   locator: page.getByTestId("Product").getByTestId("DeleteButton")
   ```

3. **Use testids over DOM traversal:**
   ```javascript
   // WRONG - fragile, breaks when DOM structure changes
   locator: page.getByRole("heading", { name: "Product" }).locator("..").locator("..")

   // CORRECT - stable, uses discovered testid chain
   locator: page.getByTestId("Product").getByTestId("DeleteButton")
   ```

4. **If no testid exists**, use this fallback priority:
   - `page.locator('[data-slot]')` - for other data attributes
   - `getByRole()` with accessible name
   - `getByLabel()` for form fields
   - `getByText()` for unique text content

**Anti-pattern (DO NOT):**
Feature file says: "click the delete button on image1"
Recording assumes: data-testid="delete-image1"  ← WRONG if not verified

**Correct pattern:**
Feature file says: "click the delete button on image1"
→ Take snapshot
→ Find actual element: [S42] button "delete" (data-testid="DeleteButton")
→ Record: page.getByTestId("Product").getByTestId("DeleteButton")

#### Mobile (Appium/WebDriverIO)

The `~accessibilityId` selector (e.g., `driver.$('~Sign in')`) is cross-platform but **only works if the app sets accessibility attributes**:
| Platform | Required Attribute |
|----------|-------------------|
| Android | `content-description` |
| iOS | `accessibilityIdentifier` or `label` |

**Common issue:** An element may have `text="Sign in"` but no `content-description`, causing `~Sign in` to fail.

**Cross-platform pattern**:
```javascript
const isAndroid = driver.isAndroid;
const element = isAndroid
  ? await driver.$('android=new UiSelector().text("Sign in")')
  : await driver.$('-ios predicate string:label == "Sign in"');
```

**Locator strategy priority:**
1. `~accessibilityId` - if app has proper accessibility attributes (preferred, cross-platform)
2. `id=resource-id` - Android resource IDs (e.g., `id=com.app:id/buttonSubmit`)
3. `android=UiSelector()` / `-ios predicate string:` - platform-specific text/attribute matching
4. XPath - last resort, fragile

### Generating the Spec File

After executing all scenario steps, use the Write tool to create a `.spec.js` file alongside the `.feature` file with:

**Test Naming Convention:**
- **Append BDD tags to the end of the test name**, space-separated, with feature-level tags first and scenario-level tags after, deduplicated: `test('ID: Title @featureTag @scenarioTag', ...)`
- This enables Playwright's `--grep` / `--grep-invert` filtering, e.g., `--grep "@staging"` to run one environment's set, `--grep-invert "@purge-data"` to skip destructive scenarios on a shared environment, or `--grep-invert "@timeout-"` to skip slow tests
- Environment tags such as `@staging` and `@prod` have no execution behaviour — like `@e2e` and `@auth` they exist only to make the generated spec filterable. `--grep` matches the file name, `describe` title, test name and tags combined, so avoid tag names that collide with words appearing in those
- If neither the feature nor the scenario has tags, the test name is just the ID and title

**Handling Existing Spec Files:**
- If a `.spec.js` file already exists, read it first to preserve the file structure
- Replace test cases that match the recorded scenario ID (e.g., `test('DAS-01: ...')`)
- Keep other existing test cases, helper functions, imports, and describe blocks intact
- Maintain the original file's formatting and organization

**Generated File Structure (unified for all scenarios):**

```javascript
import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

// ============================================================
// Helper Functions
// ============================================================

function extractAppIdFromS3() {
  const output = execSync(
    `aws --endpoint-url=${process.env.S3_ENDPOINT} s3 ls s3://apps/`,
    { encoding: 'utf-8' }
  );
  return output.match(/PRE ([a-f0-9-]{36})\//)?.[1] ?? '';
}

async function setLocalStorageAppId(context, appId) {
  await context.addInitScript((id) => {
    if (id) localStorage.setItem('app_id', JSON.stringify(id));
  }, appId);
}

async function setCookies(context, baseURL) {
  await context.addCookies([
    { name: 'x-tenant-id', value: process.env.TENANT_ID, url: baseURL },
    { name: 'x-app-id', value: process.env.APP_ID, url: baseURL },
  ]);
}

async function setupBackground(context, baseURL) {
  const appId = extractAppIdFromS3();
  await setLocalStorageAppId(context, appId);
  await setCookies(context, baseURL);
  return appId;
}

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: App Settings', () => {
  test('DAS-01: Finish onboarding @e2e @auth @purge-data', async ({ page, context, baseURL }) => {
    // @purge-data - Restore the seed data to initial state (tag action runs FIRST)
    execSync('make reseed', { stdio: 'inherit' });

    // Background (helper call runs SECOND)
    await setupBackground(context, baseURL);

    // Scenario steps (runs THIRD)
    await page.goto('/onboarding');
    // ... remaining scenario steps
  });

  test('DAS-02: Delete image @e2e @auth', async ({ page, context, baseURL }) => {
    // Background (returns appId for use in scenario)
    const appId = await setupBackground(context, baseURL);

    // Scenario steps using appId
    await page.goto('/settings');
    // ... remaining scenario steps using appId
  });
});
```

**Key points:**
- **Helper functions first**: All Background-derived helpers appear at the top of the file
- **No beforeEach**: Each test explicitly calls `setupBackground()` for clarity
- **Tags in test names**: Append BDD tags to the test name — feature tags first, then scenario tags, deduplicated (e.g., `test('DAS-01: Finish onboarding @e2e @auth @purge-data', ...)`) to enable `--grep` / `--grep-invert` filtering. `test.describe()` stays tag-free.
- **Tags also affect tag actions**: `@purge-data` adds `execSync('make reseed')` BEFORE the helper call
- **Self-contained tests**: Each test shows its full setup, making debugging easier
- **Return values**: If scenario needs a Background value (e.g., `appId`), capture it from the helper
- **No inline URLs or credentials**: navigations use relative paths resolved against `use.baseURL`; hosts, endpoints and secrets come from `process.env`

**VRT wiring (only when the scenario has `@screenshots` and VRT is configured at record time):**

Add the tracker import and derive the env defaults at module scope (the SDK reads the `VRT_*` vars natively when constructed). Construct the tracker per worker in `beforeAll` from the `browserName` fixture, and **only when the VRT backend is fully configured at run time** — a recorded spec must still pass on a machine or CI job that has no VRT credentials. If `VRT_ENABLESOFTASSERT` is unset, set it to `true` explicitly — the SDK's own default is `false`.

```javascript
import { PlaywrightVisualRegressionTracker } from '@visual-regression-tracker/agent-playwright';

const gitOutput = (command) => {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

// One build per commit: every worker derives the same ciBuildId, and the VRT backend
// upserts a build on (project, ciBuildId), so all workers report into a single build
process.env.VRT_CIBUILDID ||= gitOutput('git rev-parse HEAD');
// The SDK throws "branchName is not specified" when this is unset — it has no default
process.env.VRT_BRANCHNAME ||= gitOutput('git rev-parse --abbrev-ref HEAD');
// Default soft-assert to true unless the project opted into strict mode
process.env.VRT_ENABLESOFTASSERT ??= 'true';

// Track only when the VRT backend is fully configured; otherwise the spec runs unchanged
const isVrtEnabled = Boolean(
  process.env.VRT_APIURL &&
    process.env.VRT_APIKEY &&
    process.env.VRT_PROJECT &&
    process.env.VRT_BRANCHNAME
);

// Assigned per worker in beforeAll — the tracker needs the running project's browser name
let vrt = null;

// page.screenshot() defaults to animations: 'allow' — see "Screenshot Options"
const DEFAULT_SCREENSHOT_OPTIONS = { animations: 'disabled' };

function withScreenshotDefaults(options) {
  return {
    ...options,
    screenshotOptions: { ...DEFAULT_SCREENSHOT_OPTIONS, ...options?.screenshotOptions },
  };
}

async function trackVisualPage(page, name, options) {
  if (!vrt) return;
  await vrt.trackPage(page, name, withScreenshotDefaults(options));
}

async function trackVisualElement(locator, name, options) {
  if (!vrt) return;
  await vrt.trackElementHandle(locator, name, withScreenshotDefaults(options));
}
```

Open and close the VRT build around the visual scenarios, then emit the `[RECORD_VISUAL]` tracking calls inside the test body via the helpers:

```javascript
test.describe('Feature: App Settings', () => {
  // browserName is a worker-scoped fixture, so it is available in beforeAll
  test.beforeAll(async ({ browserName }) => {
    if (!isVrtEnabled) return;
    // Reads VRT_APIURL / VRT_PROJECT / VRT_APIKEY / VRT_BRANCHNAME / VRT_CIBUILDID / VRT_ENABLESOFTASSERT
    vrt = new PlaywrightVisualRegressionTracker(browserName);
    await vrt.start();
  });

  test.afterAll(async () => {
    if (!vrt) return;
    await vrt.stop();
    vrt = null;
  });

  test('DAS-01: Finish onboarding @e2e @auth @screenshots', async ({ page, context, baseURL }) => {
    await setupBackground(context, baseURL);
    await page.goto('/onboarding');

    // Then I should see the onboarding page
    await expect(page.getByTestId('OnboardingPage')).toBeVisible();

    // And I should see the welcome banner
    await expect(page.getByTestId('WelcomeBanner')).toBeVisible();

    // One shot for the whole assertion group, after the last assertion has settled
    await trackVisualPage(
      page,
      'DAS-01-i-should-see-the-welcome-banner',
      { diffTollerancePercent: 1 }
    );
  });
});
```

- Keep the import, the helpers, and `vrt.start()`/`vrt.stop()` **conditional on the tag** at record time — specs without a `@screenshots` scenario are unchanged.
- `isVrtEnabled` is the **run-time** switch layered on top. When it is false the spec still passes: no build is opened, no tracking call fires, and every non-visual assertion in the scenario runs exactly as before. Never call `vrt.trackPage` / `vrt.trackElementHandle` directly from a test body — always go through `trackVisualPage` / `trackVisualElement` so the guard cannot be bypassed.
- Construct the tracker with the `browserName` worker fixture. Browser is part of the baseline key, so each Playwright project gets its own baseline to approve, while all of them still report into the one `VRT_CIBUILDID` build.
- The `process.env` defaults MUST stay at module scope, which runs **before** `beforeAll` constructs the tracker — the SDK reads them at construction. Use `||=` (not `??=`) for the git-derived ones so an empty env var still falls back. There is deliberately no `main` fallback for `VRT_BRANCHNAME`: outside a git checkout it stays empty and `isVrtEnabled` turns VRT off, rather than silently comparing against the wrong baseline branch.
- `withScreenshotDefaults` is why `[RECORD_VISUAL]` annotations never need to spell out `animations: 'disabled'` — the choke point applies it. A recorded `screenshotOptions` merges on top; see [Screenshot Options](#screenshot-options).

### Example Recording Session

Feature step:
```gherkin
When I enter "John" in the "Name" field
And I click the "CREATE" button
Then a confirmation dialog should appear
```

Claude's output during execution:
```
Filling "Name" field with "John"...

[RECORD_ACTION]
step: "When I enter \"John\" in the \"Name\" field"
method: fill
locator: page.getByLabel('Name')
value: "John"
[/RECORD_ACTION]

Clicking CREATE button...

[RECORD_ACTION]
step: "And I click the \"CREATE\" button"
method: click
locator: page.getByRole('button', { name: 'CREATE' })
[/RECORD_ACTION]

Taking snapshot to verify dialog...
Dialog found at ref [S1].

[RECORD_EXPECT]
step: "Then a confirmation dialog should appear"
locator: page.getByRole('dialog')
assertion: toBeVisible
[/RECORD_EXPECT]
```

Generated Playwright code:
```javascript
// When I enter "John" in the "Name" field
await page.getByLabel('Name').fill('John');

// And I click the "CREATE" button
await page.getByRole('button', { name: 'CREATE' }).click();

// Then a confirmation dialog should appear
await expect(page.getByRole('dialog')).toBeVisible();
```

### Example: S3 Verification Recording

Feature step:
```gherkin
And the image should be deleted from S3 bucket "apps" at "{appId}/assets/image1.png"
```

Claude's output during execution:
```
Verifying S3 deletion via AWS CLI...

[RECORD_COMMAND]
step: "And the image should be deleted from S3 bucket"
command: aws --endpoint-url=${process.env.S3_ENDPOINT} s3 ls s3://apps/0bec779c-db96-4c0e-b78f-800888d4fe20/assets/image1.png
assertion: shouldFail
[/RECORD_COMMAND]
```

Generated Playwright code:
```javascript
// And the image should be deleted from S3 bucket
expect(() => execSync(
  `aws --endpoint-url=${process.env.S3_ENDPOINT} s3 ls s3://apps/${appId}/assets/image1.png`,
  { stdio: "pipe" }
)).toThrow();
```

## Example Inputs

- Execute BDD scenario ARMR-01 in @path/to/file.feature
- Execute scenario ARMR-06 for Driver card in @path/to/file.feature
- Execute all scenarios in @path/to/file.feature
- Run scenario ARMR-03 from @path/to/file.feature
- Run the ARMR-05 test in file.feature
- Test ARMR-02 scenario
- Execute BDD scenario DAS-02 in @path/to/file.feature --record
- Execute all scenarios in @path/to/file.feature --record
