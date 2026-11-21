# DSA5 Copilot Knowledge Base

An index plus small topic docs, not a reproduction of the rulebook.

- `rules/rulebook-index.md` — chapter → page map and list of topic docs
- `rules/<topic>/*.md` — concise, implementation-oriented summaries with `S. <page>` sources
- `../../scripts/dsa5_pages.py` — extracts printed pages from `DSA5 rulebook.pdf` (`pip install pypdf`)

Lookup order (cheapest first):

1. Topic doc in `rules/<topic>/`
2. Page range from `rules/rulebook-index.md`
3. Extract only those pages:
   ```powershell
   python scripts/dsa5_pages.py 226-228
   python scripts/dsa5_pages.py 225-250 --grep "Verteidigung"
   ```
   Use printed page numbers; the script handles the PDF offset.

Copilot prompts (type `/` in chat):

- `/summarize-dsa-rule` — turn rulebook pages into a topic doc
- `/implement-dsa-rule` — implement a mechanic with source citations and tests
- `/review-dsa-rule` — audit existing code against the rulebook
