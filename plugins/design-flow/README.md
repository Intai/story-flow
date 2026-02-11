## Agentic Design Workflow

A Claude plugin for collaborative product and UI design exploration. This plugin sits upstream of [story-flow](https://github.com/Intai/story-flow), helping teams define product requirements, establish visual design systems, and create UI designs before development begins.

### Prerequisite

- Chrome DevTools MCP: Run `/mcp` to verify connection status.

### Steps

1. 🤖🧠 **Explore product design for the feature** \
   Use product-designer subagent to bounce ideas and create a product design in markdown. \
   Discuss user needs, edge cases, business requirements, and acceptance criteria collaboratively with Claude to produce a clear product specification.

2. 🤖🧠 **Create a style guide** (one-time setup, skip if already established) \
   Use ui-designer subagent to bounce ideas and establish design system foundations: color palette, typography, spacing, component patterns, and accessibility standards. \
   This ensures visual consistency across all features.

3. 🤖🧠 **Design UI layouts** \
   Use ui-designer subagent to create UI layout designs in ASCII wireframe format according to the product design. \
   Bounce ideas with Claude to review the layouts for clarity, usability, and responsiveness.

4. 🤖🧠 **Create UI designs** \
   Use ui-designer subagent to create UI designs in static HTML files according to the style guide and layout designs. \
   Iterate with Claude to review and finalise design details.

   **Then:**
   1. Groom, refine, and story point the feature with the team before continuing to development.
   2. Continue on story-flow [step 1](https://github.com/Intai/story-flow#steps) to create the technical story markdown according to the designs.

### Installation

Add the marketplace to Claude Code:
```
/plugin marketplace add Intai/story-flow
```

Browse and install the design-flow plugin:
```
/plugin
```
