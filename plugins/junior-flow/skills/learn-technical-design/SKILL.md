---
name: Learn why to discuss technical design before implementation
description: Interactive guidance on creating technical design PRs to align with your team before coding.
user-invocable: false
---

# Why Discuss Technical Design Before Implementation?

## Overview

This learning module helps junior developers understand why creating a technical design PR before implementation leads to better outcomes, faster delivery, and reduced rework.

## Instructions

Present the following content interactively. After each section, use `AskUserQuestion` to offer 3 options:
- "Continue to next section"
- "Show me an example"
- "I have a question"

---

## Section 1: The Purpose of Technical Design PRs

Explain that in story-flow, before writing implementation code, developers create a pull request containing their technical design:

**A technical design PR serves three purposes:**

1. **Early feedback on approach** - Get team input before investing time in implementation
2. **Alignment before coding** - Ensure everyone agrees on the direction
3. **Living documentation** - The merged design becomes part of the repo history

**The key insight:**

> A technical design PR is not about seeking permission. It's about leveraging collective expertise to find the best solution before committing to an approach.

**What gets included:**

- Story requirements (from Jira/ClickUp, Figma analysis)
- Planned tasks with execution order
- Pseudo code, example payloads, or expected API responses
- Questions or concerns for reviewers

---

## Section 2: The Shift-Left Concept

Explain the "shift-left" principle:

**Shift-left** means moving quality activities earlier in the development lifecycle.

Traditional approach (problems found late):
```
Design → Code → Code Review → QA → Production
                              ↑
                     Problems found here
                     (expensive to fix)
```

Shift-left approach (problems found early):
```
Design Review → Code → Code Review → QA → Production
      ↑
Problems found here
(cheap to fix)
```

**Why "left"?**

If you imagine the development timeline flowing left-to-right, shifting activities to the left means doing them earlier.

**The cost curve:**

| Stage Where Issue Found | Relative Cost to Fix |
|------------------------|---------------------|
| Design review | 1x |
| Code review | 5x |
| QA testing | 10x |
| Production | 100x |

Issues found later require:
- Undoing completed work
- Retesting affected areas
- Potential customer impact
- Emergency context-switching

---

## Section 3: Cost-Effectiveness Benefits

Present the concrete benefits:

### 1. Avoid Wasted Implementation Effort

Without design review:
```
Developer spends 3 days implementing Feature X
  → Code review reveals a simpler approach exists
  → 3 days of work discarded
  → Rework begins
```

With design review:
```
Developer spends 2 hours writing design PR
  → Team suggests simpler approach
  → 2 hours adjusted
  → Implementation proceeds correctly
```

### 2. Reduce Rework Cycles

| Approach | Typical Iterations |
|----------|-------------------|
| Code first, discuss later | 3-5 review cycles |
| Design first, code second | 1-2 review cycles |

### 3. Faster Overall Delivery

**Paradox:** Adding a "planning step" actually speeds up delivery.

```
Without planning:   [3 days coding] + [2 days rework] = 5 days
With planning:      [2 hours design] + [2 days coding] = 2.25 days
```

### 4. Knowledge Sharing

Design PRs help the team:
- Understand upcoming changes
- Suggest improvements from past experience
- Identify conflicts with parallel work
- Onboard new team members through design history

---

## Section 4: What to Include in a Technical Design PR

Present the recommended structure:

### In the Story Markdown File

**1. Story Requirements**
- Acceptance criteria from Jira/ClickUp
- Insights from Figma designs
- Business context and user impact

**2. Planned Tasks**
- Ordered list of implementation steps
- Dependencies between tasks
- Which tasks can run in parallel
- Each task includes technical approach details:
  - Key design decisions
  - Pseudo code for complex logic
  - Example payloads or API contracts

```typescript
// Example task with embedded technical approach:
// Task: Add user authentication endpoint @src/api/auth.ts
// - Use JWT tokens with 24h expiry
// - Store refresh tokens in httpOnly cookies
//
// Expected API response:
interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
  };
}
```

### In the Pull Request

**3. Alternatives Considered** *(include in PR description or comments)*

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Option A | Fast to implement | Hard to extend | |
| Option B | Flexible | More complex | Chosen |

**4. Questions for Reviewers** *(include in PR description or comments)*
- Highlight uncertainties
- Ask for input on specific decisions
- Flag areas where you need guidance

---

## Section 5: Common Mistakes to Avoid

Present each mistake with correction:

### Mistake 1: Skipping Design for "Simple" Changes

```
"This is just a small feature, I'll skip the design PR"
  → Feature has hidden complexity
  → Major rework needed after code review
```

**Better approach:** Start with a lightweight design. If it's truly simple, the design takes 15 minutes and confirms that.

### Mistake 2: Not Enough Implementation Detail

```markdown
# BAD - Too vague
## Tasks
- Add authentication
- Update UI
```

```markdown
# GOOD - Actionable detail
## Tasks
1. Create AuthService class with login/logout methods
2. Add JWT token storage in localStorage
3. Create ProtectedRoute component wrapper
4. Update Header to show user email when logged in
```

### Mistake 3: Treating Design as Final

```
"The design is approved, I can't change anything now"
```

**Reality:** Designs evolve during implementation. When you discover something that changes the approach:
1. Update the story markdown
2. Comment on the PR explaining the change
3. Continue implementation

### Mistake 4: Rushing to Merge Without Feedback

```
"No comments after 4 hours, I'll merge and start coding"
```

**Better approach:**
- Directly ping reviewers if urgent
- Wait for at least one approval
- Silence doesn't mean approval

### Mistake 5: Creating Design After Starting Implementation

```
"I'll code this first, then write up what I did"
```

This defeats the purpose. Post-hoc documentation:
- Doesn't catch design issues early
- Doesn't benefit from team input
- Becomes a justification, not a discussion

---

## Section 6: Quick Reference Checklist

Present this checklist for the developer to keep:

**Before submitting a technical design PR, verify:**

- [ ] Story requirements are clearly documented
- [ ] Tasks are specific and ordered
- [ ] Dependencies between tasks are identified
- [ ] Technical approach includes concrete examples
- [ ] Pseudo code or payload examples for complex logic
- [ ] Alternatives were considered and documented
- [ ] Questions for reviewers are highlighted
- [ ] Related Jira/ClickUp story is mentioned

**During review:**

- [ ] Respond to all comments
- [ ] Update design based on feedback
- [ ] Resolve addressed conversations
- [ ] Wait for at least one approval

**After merge:**

- [ ] Implementation follows the approved design
- [ ] Design updates are reflected in story markdown
- [ ] Major deviations are communicated to reviewers

---

## Example Inputs

- Learn about technical design PRs
- Why should I create a design before coding?
- What is shift-left?
- How do I write a good technical design?
- Teach me about planning before implementation
