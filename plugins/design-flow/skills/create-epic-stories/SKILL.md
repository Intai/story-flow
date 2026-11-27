---
name: Create epics and stories in a story tracker
description: Break a feature into an epic and story-pointed stories from product designs, UI designs, transcripts and video recordings, then create them in the story tracker after review.
user-invocable: false
---

# Create epics and stories in a story tracker

## Phase 1: Gather Sources

Sort each source argument by type. Expand a folder into the files inside it, then sort them the same way:

| Source | Treated as |
|---|---|
| `.md` | Product design or UI layout |
| `.html` | UI design |
| `.mp4` `.mov` `.webm` `.mkv` | Video recording |
| `.txt` `.vtt` `.srt` `.docx` | Meeting transcript |
| Design URL (e.g. `figma.com`) | Design, fetched with the design tool's MCP |
| Ticket ID (e.g. `PROJ-123`, `86d2uf1mh`, `4821`, `AB#4821`) | Tracker item, fetched with its description and attachments |

- When no sources are given, list the sources found in the conversation and ask the user for the rest.
- Read the design markdown, HTML and tracker items directly.
- Hand each video and each transcript to its own general-purpose subagent, all in one message so they run in parallel. Hand a transcript that shares its video's basename to that video's subagent. Each subagent returns only the decisions, user flows, edge cases and open questions, never the raw frames or transcript.
- For a video, the subagent checks `command -v ffmpeg`, then extracts at most 50 frames on scene change into a temporary directory and reads them as images:
  ```
  ffmpeg -i <video> -vf "select='gt(scene,0.3)'" -vsync vfr -frames:v 50 <tmpdir>/frame-%03d.png
  ```
  If ffmpeg is not installed, tell the user and continue without the video.
- If no story tracker MCP tool is available, tell the user the project has no story tracker MCP server configured (`/mcp` to check status), and continue to Phase 6 for a markdown breakdown.

## Phase 2: Find the Epic

- If a source ticket is an epic, add the stories under it and do not create a new epic.
- Otherwise search the tracker for an epic matching the feature. When one is found, ask the user whether to add the stories under it before creating a new epic.
- Fetch the epic's existing stories, so the breakdown never duplicates them.

## Phase 3: Break Down Stories

Split the feature into vertical slices, each deliverable and demoable on its own. For each story:
- Summary (user story statement)
- Acceptance criteria
- High-level technical decisions stated in the sources that affect security, performance, data integrity, compatibility, maintainability or readability, never code-level details such as files, functions or libraries
- Design references (design file paths, Figma links, frames)
- Dependencies on other stories
- Out of scope

List the open questions from the subagents and sources that the breakdown could not resolve, including technical decisions raised but not settled.

## Phase 4: Estimate Story Points

- Fetch the project's reference stories from the tracker. If the project-level skill does not name them, ask the user for their IDs or a query.
- Give each story points on the project's scale, with the 1 closest reference story it was compared against as the reason.

## Phase 5: Review

- Present the breakdown as a table: summary, points, closest reference story, dependencies.
- Iterate with the user until they approve. Create nothing in the tracker before approval.

## Phase 6: Create

- Create the epic if needed, then each story with its acceptance criteria, technical decisions, design references and points, linked to the epic.
- Report each created item's ID and URL.
- If the tracker MCP is missing or cannot create items, output the approved breakdown as markdown for manual entry.
