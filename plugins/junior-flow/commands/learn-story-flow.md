---
argument-hint: [topic (optional)]
description: Learn story-flow concepts with interactive guidance for junior developers
---

If a topic is provided ($1), load the corresponding skill using the Skill tool:
- Load skill: `junior-flow:learn-$1`

If no topic is provided, output the following exactly:

---

Which topic would you like to explore? (Enter the number or topic name)

| # | Topic | Description |
|---|-------|-------------|
| 1 | `technical-design` | Why discuss technical design before implementation? |
| 2 | `bdd-scenarios` | What defines effective, complete BDD scenarios? |

---

After the developer selects a topic, load the corresponding skill.

If the requested topic doesn't exist, inform the developer and show the available topics table above.
