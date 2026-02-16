---
name: Learn what defines effective BDD scenarios
description: Interactive guidance on writing complete, effective BDD scenarios for story-flow.
user-invocable: false
---

# What Defines Effective, Complete BDD Scenarios

## Overview

This learning module helps junior developers understand how to write BDD (Behavior-Driven Development) scenarios that are effective for story-flow's automated testing workflow.

## Instructions

Present the following content interactively. After each section, use `AskUserQuestion` to offer 3 options:
- "Continue to next section"
- "Show more examples"
- "I have a question"

---

## Section 1: The Purpose of BDD Scenarios

Explain that in story-flow, BDD scenarios serve two purposes:

1. **Executable specifications** - Claude uses Playwright MCP to execute these scenarios directly in a browser
2. **Regression test generation** - With `--record` flag, scenarios become Playwright `.spec.js` files

This means scenarios must be:
- **Precise enough** for automated execution
- **Complete enough** to verify the feature works correctly
- **Structured correctly** so Claude can follow them step-by-step

---

## Section 2: Anatomy of an Effective BDD Scenario

Present this structure with explanations:

```gherkin
Feature: [Feature name matching the story]

Background:
  # Shared setup steps that run before EVERY scenario
  Given I am logged in as "test@example.com"
  And I am on the settings page

@purge-data
Scenario: FEAT-01: [Clear, descriptive title]
  # Given - Initial state/context
  Given there are 3 images in the gallery

  # When - The action being tested
  When I click the "Delete" button on the first image
  And I confirm the deletion in the dialog

  # Then - Expected outcome (assertions)
  Then I should see 2 images in the gallery
  And the deleted image should not be visible
  And the image should be removed from S3 bucket
```

**Key elements:**

| Element | Purpose | Example |
|---------|---------|---------|
| `Feature:` | Groups related scenarios | `Feature: Image Gallery Management` |
| `Background:` | Shared setup (runs before each scenario) | Login, navigation, seed data |
| `@tags` | Control execution behavior | `@purge-data`, `@screenshots` |
| `Scenario: ID:` | Unique identifier + descriptive title | `FEAT-01: Delete single image` |
| `Given` | Preconditions/initial state | `Given there are 3 images` |
| `When` | User actions | `When I click "Delete"` |
| `Then` | Expected outcomes | `Then I should see 2 images` |

---

## Section 3: The Five Qualities of Effective Scenarios

### 1. Specific and Unambiguous

Show the difference:

```gherkin
# BAD - Vague, Claude won't know what to do
When I update the settings
Then it should work

# GOOD - Specific actions and outcomes
When I enter "John Doe" in the "Display Name" field
And I click the "Save" button
Then I should see "Settings saved successfully" message
And the "Display Name" field should show "John Doe"
```

### 2. Complete Assertions

Every scenario should verify:
- **Visual feedback** - What the user sees
- **Data persistence** - That changes are saved (API, S3, database)
- **Error states** - When applicable

```gherkin
# INCOMPLETE - Only checks UI
Then I should see "Image deleted" message

# COMPLETE - Checks UI + data layer
Then I should see "Image deleted" message
And the image should be removed from S3 bucket "apps" at "{appId}/assets/image1.png"
And the gallery should show 2 images
```

### 3. Independence at the Right Level

**Feature files should be independent** - Each `.feature` file should not rely on another feature file running first. Use `@purge-data` on the first scenario to ensure clean state.

**Scenarios within a feature CAN depend on each other** - For realistic user journeys, scenarios can build on previous ones:

This approach:
- Tests realistic user flows end-to-end
- Reduces repetitive setup steps
- Makes feature files self-contained and runnable in isolation

```gherkin
@purge-data  # Ensures clean state for this feature file
Scenario: FEAT-01: Create a new project
  When I click "New Project"
  And I enter "My App" in the "Project Name" field
  And I click "Create"
  Then I should see "My App" in the project list

Scenario: FEAT-02: Add an image to the project
  # Builds on FEAT-01 - "My App" already exists
  Given I am viewing the "My App" project
  When I upload "logo.png"
  Then the image should appear in the gallery

Scenario: FEAT-03: Delete the project
  # Builds on previous scenarios
  When I click "Delete Project" on "My App"
  And I confirm the deletion
  Then "My App" should not appear in the project list
```

### 4. Uses Concrete Values

```gherkin
# BAD - Abstract
Given some images exist
When I enter a name
Then it should be saved

# GOOD - Concrete
Given there are 3 images in the gallery
When I enter "Product Photo 1" in the "Image Name" field
Then the first image should be named "Product Photo 1"
```

### 5. Covers Happy Path AND Edge Cases

A complete feature should have scenarios for:

| Type | Example |
|------|---------|
| Happy path | User successfully completes the action |
| Validation errors | User enters invalid data |
| Empty states | No data exists yet |
| Boundary conditions | Max length, first/last items |
| Error recovery | Network failure, timeout |

---

## Section 4: Supported Tags

Explain the supported tags:

| Tag | Effect | When to Use |
|-----|--------|-------------|
| `@purge-data` | Runs `make reseed` before scenario | When scenario needs clean/known state |
| `@screenshots` | Takes screenshots during execution | For visual verification or debugging |

```gherkin
@purge-data @screenshots
Scenario: FEAT-05: Onboarding flow for new user
  # This scenario needs fresh data AND visual verification
  Given I am a new user
  When I complete the onboarding wizard
  Then I should see the dashboard
```

---

## Section 5: Common Mistakes to Avoid

Present each mistake with correction:

### Mistake 1: Testing Implementation, Not Behavior

```gherkin
# BAD - Tests implementation details
Then the Redux store should have user.name = "John"
And the API should return 200

# GOOD - Tests user-visible behavior
Then I should see "John" in the profile header
And the "Name" field should show "John"
```

### Mistake 2: Combining Multiple Behaviors

```gherkin
# BAD - Tests too many things
Scenario: User management
  When I create a user
  And I edit the user
  And I delete the user
  Then everything works

# GOOD - One behavior per scenario
Scenario: FEAT-01: Create new user
  When I fill in user details and click "Create"
  Then the new user should appear in the list

Scenario: FEAT-02: Edit existing user
  Given a user "John" exists
  When I change the name to "Jane"
  Then the user should be renamed to "Jane"
```

### Mistake 3: Missing Background Setup

```gherkin
# BAD - Assumes logged in state
Scenario: Update profile
  When I click "Edit Profile"  # Will fail if not logged in!

# GOOD - Background ensures prerequisites
Background:
  Given I am logged in as "test@example.com"
  And I am on the profile page

Scenario: FEAT-01: Update profile name
  When I click "Edit Profile"
  ...
```

### Mistake 4: Vague Assertions

```gherkin
# BAD - How does Claude verify "correctly"?
Then the form should be submitted correctly

# GOOD - Specific, verifiable outcomes
Then I should see "Form submitted" success message
And I should be redirected to the confirmation page
And the submitted data should appear in the list
```

---

## Section 6: Quick Reference Checklist

Present this checklist for the developer to keep:

**Before submitting a BDD scenario, verify:**

- [ ] Scenario ID follows pattern: `FEAT-01: Descriptive title`
- [ ] Given steps establish clear preconditions
- [ ] When steps describe specific user actions
- [ ] Then steps have concrete, verifiable assertions
- [ ] UI assertions (what the user sees)
- [ ] Data assertions (S3, API, database state)
- [ ] `@purge-data` tag added if clean state needed
- [ ] Background section used for shared setup
- [ ] One behavior tested per scenario
- [ ] Edge cases covered in separate scenarios

---

## Example Inputs

- Learn about BDD scenarios
- Teach me how to write good BDD tests
- What makes a BDD scenario effective?
- Help me understand story-flow testing
