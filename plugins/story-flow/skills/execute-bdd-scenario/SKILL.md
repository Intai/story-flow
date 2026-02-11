---
name: Execute BDD scenarios
description: Execute BDD test scenarios from .feature files using browser automation.
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
    Use `story-flow:execute-bdd-scenario` and `execute-bdd-scenario` skills using the Skill tool to execute BDD scenario ARMR-01 in @path/to/file.feature [--record if recording mode is active].
    ```
    **Recording Mode:** When executing multiple scenarios with `--record`, pass the flag to each subagent prompt. Recording and Playwright `.spec.js` generation happen within each scenario's subagent isolated context, not at the parent orchestration level.
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
- If a BDD scenario has the `@screenshots` tag, take screenshots throughout the execution.
- If a BDD scenario doesn't have the `@screenshots` tag, do not take any screenshot.
- If a BDD scenario has the `@purge-data` tag, restore the seed data first (before the Background steps) by executing the `make reseed` command.
- If a BDD scenario does not have the `@purge-data` tag, do not restore the seed data before running the scenario.
- Use `mcp__playwright__browser_run_code` to set the browser offline.
- Reference the @Makefile for local development workflows.

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
```typescript
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
```typescript
{
  hostname: "hub-cloud.browserstack.com",
  port: 443,
  protocol: "https" as const,
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
        ```typescript
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
    - When the scenario has `@screenshots` tag
  - Page source is faster and provides structured data; screenshots are only needed when pixel-level visual verification is required.
- **Multi-finger gestures (3-finger tap, pinch, etc.):**
  - The Appium MCP tools don't have direct multi-finger support, so use the W3C Actions API via HTTP.

## Recording Mode (--record flag)

When the `--record` flag is present in the input, generate a Playwright `.spec.js` file after executing **every** scenario by recording actions and expectations during execution.

### Recording Scenario Tags

When recording, capture scenario tags and output them BEFORE recording any other steps (including Background):

```
[RECORD_TAG]
scenario: "DAS-01: Finish onboarding"
tags: ["@purge-data"]
[/RECORD_TAG]
```

**Annotation fields:**
- `scenario`: The scenario ID and title
- `tags`: Array of tags applied to this scenario

**Example: Scenario with @purge-data tag and Background**

Feature file:
```gherkin
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
tags: ["@purge-data"]
[/RECORD_TAG]
```

Generated Playwright code (note: tag action comes BEFORE Background helper call):
```typescript
test('DAS-01: Finish onboarding', async ({ page, context }) => {
  // @purge-data - Restore the seed data to initial state (runs FIRST)
  execSync('make reseed', { stdio: 'inherit' });

  // Background (runs SECOND)
  await setupBackground(context);

  // Scenario steps (runs THIRD)
  // Given I am on the onboarding page
  await page.goto('http://localhost:8080/onboarding');
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
    "AWS_ACCESS_KEY_ID=minioadmin AWS_SECRET_ACCESS_KEY=minioadmin aws --endpoint-url=http://localhost:9000 s3 ls s3://apps/",
    { encoding: "utf-8" }
  );
  return output.match(/PRE ([a-f0-9-]{36})\//)?.[1] ?? "";
[/RECORD_HELPER]
```

**Annotation fields:**
- `name`: Function name (camelCase, descriptive)
- `params`: Array of typed parameters (e.g., `["context: BrowserContext", "appId: string"]`)
- `returns`: Return type (e.g., `"string"`, `"Promise<void>"`, `"Promise<string>"`)
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
    "AWS_ACCESS_KEY_ID=minioadmin AWS_SECRET_ACCESS_KEY=minioadmin aws --endpoint-url=http://localhost:9000 s3 ls s3://apps/",
    { encoding: "utf-8" }
  );
  return output.match(/PRE ([a-f0-9-]{36})\//)?.[1] ?? "";
[/RECORD_HELPER]
```

The value is then available in the test via the composite helper's return value:

```typescript
test('DAS-02: Delete image', async ({ page, context }) => {
  // Background (returns appId for use in scenario)
  const appId = await setupBackground(context);

  // Scenario steps can now use appId...
});
```

### Recording Actions (Given/When steps)

After each action step, output a structured annotation:

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

After verifying each assertion step, output a structured annotation:

```
[RECORD_EXPECT]
step: "Then I should see 3 images in the product section"
locator: page.getByTestId('Product').locator('img')
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

**Locator Selection for expectations:**

Playwright's accessibility snapshot does NOT show `data-testid` attributes. Use JavaScript evaluation to discover testids for the specific element you're interacting with.

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
   ```typescript
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

### Recording Command Line Executions

For steps that require command line verification (e.g., S3 state checks), output:

```
[RECORD_COMMAND]
step: "And the image should be deleted from S3 bucket"
command: AWS_ACCESS_KEY_ID=minioadmin AWS_SECRET_ACCESS_KEY=minioadmin aws --endpoint-url=http://localhost:9000 s3 ls s3://apps/${appId}/assets/image.png
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

```typescript
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
```typescript
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
```typescript
async function takeAppScreenshot(driver: WebdriverIO.Browser, filename: string): Promise<string> {
  const imagePath = path.join(process.cwd(), '.appium-mcp', filename);
  await driver.saveScreenshot(imagePath);
  return imagePath;
}

function verifyColorAtPixel(imagePath: string, x: number, y: number, expectedColor: string): void {
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
```typescript
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
command: AWS_ACCESS_KEY_ID=minioadmin ... s3 cp s3://apps/${appId}/user.json -
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
function getS3User(appId: string): Record<string, unknown> {
  try {
    const output = execSync(
      `AWS_ACCESS_KEY_ID=minioadmin AWS_SECRET_ACCESS_KEY=minioadmin aws --endpoint-url=http://localhost:9000 s3 cp s3://apps/${appId}/user.json - 2>/dev/null`,
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
  ```typescript
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
  ```typescript
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
```typescript
// WRONG - hardcoded wait
await page.goto("http://localhost:8080/settings");
await page.waitForTimeout(2000);

// CORRECT - wait for network to settle
await page.goto("http://localhost:8080/settings");
await page.waitForLoadState("networkidle");

// BEST - wait for specific content you need
await page.goto("http://localhost:8080/settings");
await expect(page.locator('[alt^="image"]')).toHaveCount(3);
```

**Pattern for actions that trigger async operations:**
```typescript
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
1. `page.getByTestId('OnboardingPrimaryColor')` - **ALWAYS check for data-testid first**
2. `page.locator('[data-slot="sidebar-overlay"]')` - for other data attributes
3. `page.getByRole('button', { name: 'Submit' })` - for semantic elements
4. `page.getByLabel('Name')` - for form fields
5. `page.getByPlaceholder('Enter name')` - for placeholder text
6. `page.getByText('Error message')` - for text content
7. `page.locator('.class-name')` - fallback for CSS selectors

**Anti-pattern (DO NOT):**
Feature file says: "click the delete button on image1"
Recording assumes: data-testid="delete-image1"  ← WRONG if not verified

**Correct pattern:**
Feature file says: "click the delete button on image1"
→ Take snapshot
→ Find actual element: [S42] button "delete" (data-testid="DeleteButton")
→ Record: page.locator('[data-testid="DeleteButton"]').first()

#### Mobile (Appium/WebDriverIO)

The `~accessibilityId` selector (e.g., `driver.$('~Sign in')`) is cross-platform but **only works if the app sets accessibility attributes**:
| Platform | Required Attribute |
|----------|-------------------|
| Android | `content-description` |
| iOS | `accessibilityIdentifier` or `label` |

**Common issue:** An element may have `text="Sign in"` but no `content-description`, causing `~Sign in` to fail.

**Cross-platform pattern**:
```typescript
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

### Generating the Mandatory Spec File

At scenario completion, use the Write tool to create a `.spec.js` file alongside the `.feature` file with:

**Handling Existing Spec Files:**
- If a `.spec.js` file already exists, read it first to preserve the file structure
- Replace test cases that match the recorded scenario ID (e.g., `test('DAS-01: ...')`)
- Keep other existing test cases, helper functions, imports, and describe blocks intact
- Maintain the original file's formatting and organization

**Generated File Structure (unified for all scenarios):**

```typescript
import { expect, test, BrowserContext, Page } from '@playwright/test';
import { execSync } from 'child_process';

// ============================================================
// Helper Functions
// ============================================================

function extractAppIdFromS3(): string {
  const output = execSync(
    'AWS_ACCESS_KEY_ID=minioadmin AWS_SECRET_ACCESS_KEY=minioadmin aws --endpoint-url=http://localhost:9000 s3 ls s3://apps/',
    { encoding: 'utf-8' }
  );
  return output.match(/PRE ([a-f0-9-]{36})\//)?.[1] ?? '';
}

async function setLocalStorageAppId(context: BrowserContext, appId: string): Promise<void> {
  await context.addInitScript((id) => {
    if (id) localStorage.setItem('app_id', JSON.stringify(id));
  }, appId);
}

async function setCookies(context: BrowserContext): Promise<void> {
  await context.addCookies([
    { name: 'x-tenant-id', value: '0595cc48-354b-4b13-8f17-fe65d7f79146', domain: 'localhost', path: '/' },
    { name: 'x-app-id', value: 'd37a8fae-ed2d-4a78-9d71-d5a3dfe0d0ca', domain: 'localhost', path: '/' },
  ]);
}

async function setupBackground(context: BrowserContext): Promise<string> {
  const appId = extractAppIdFromS3();
  await setLocalStorageAppId(context, appId);
  await setCookies(context);
  return appId;
}

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: App Settings', () => {
  test('DAS-01: Finish onboarding', async ({ page, context }) => {
    // @purge-data - Restore the seed data to initial state (tag action runs FIRST)
    execSync('make reseed', { stdio: 'inherit' });

    // Background (helper call runs SECOND)
    await setupBackground(context);

    // Scenario steps (runs THIRD)
    await page.goto('http://localhost:8080/onboarding');
    // ... remaining scenario steps
  });

  test('DAS-02: Delete image', async ({ page, context }) => {
    // Background (returns appId for use in scenario)
    const appId = await setupBackground(context);

    // Scenario steps using appId
    await page.goto('http://localhost:8080/settings');
    // ... remaining scenario steps using appId
  });
});
```

**Key points:**
- **Helper functions first**: All Background-derived helpers appear at the top of the file
- **No beforeEach**: Each test explicitly calls `setupBackground()` for clarity
- **Tags only affect tag actions**: `@purge-data` adds `execSync('make reseed')` BEFORE the helper call
- **Self-contained tests**: Each test shows its full setup, making debugging easier
- **Return values**: If scenario needs a Background value (e.g., `appId`), capture it from the helper

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
```typescript
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
command: AWS_ACCESS_KEY_ID=minioadmin AWS_SECRET_ACCESS_KEY=minioadmin aws --endpoint-url=http://localhost:9000 s3 ls s3://apps/0bec779c-db96-4c0e-b78f-800888d4fe20/assets/image1.png
assertion: shouldFail
[/RECORD_COMMAND]
```

Generated Playwright code:
```typescript
// And the image should be deleted from S3 bucket
expect(() => execSync(
  `AWS_ACCESS_KEY_ID=minioadmin AWS_SECRET_ACCESS_KEY=minioadmin aws --endpoint-url=http://localhost:9000 s3 ls s3://apps/${appId}/assets/image1.png`,
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
