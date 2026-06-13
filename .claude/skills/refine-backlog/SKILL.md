# /refine-backlog

Refine the product-os backlog: audit WorkItem quality, sharpen acceptance criteria into testable Given/When/Then scenarios, wire dependency relationships, and mark the first executable wave as `ready`.

Draws on the `deliver-user-stories` and `deliver-acceptance-criteria` methodology from pm-skills (Apache 2.0), adapted for the product-os data model.

## Usage

```
/refine-backlog                          # refine all new stories in product-os
/refine-backlog "Execution Planning"     # scope to a single capability or feature
```

---

## Process

### Step 1 — Load the backlog

Run this to get the current state:

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const items = await p.workItem.findMany({
    where: { product: { slug: 'product-os' }, status: { in: ['new','ready'] }, type: { in: ['feature','story','task'] } },
    select: { id: true, type: true, status: true, title: true, description: true, acceptance_criteria: true, parent: { select: { title: true, type: true } } },
    orderBy: [{ type: 'asc' }, { created_at: 'asc' }]
  });
  console.log(JSON.stringify(items, null, 2));
}
main().finally(() => p.\$disconnect());
"
```

Also load existing dependency relationships:

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const rels = await p.relationship.findMany({
    where: { product: { slug: 'product-os' }, relationship_type: { in: ['blocks','depends_on'] } },
    select: { from_work_item: { select: { title: true } }, to_work_item: { select: { title: true } }, relationship_type: true }
  });
  console.log(JSON.stringify(rels, null, 2));
}
main().finally(() => p.\$disconnect());
"
```

If a capability or feature name was passed as an argument, filter to items whose parent title matches.

---

### Step 2 — Audit each story

For every story, evaluate:

| Check | Pass condition |
|-------|---------------|
| **Acceptance criteria present** | `acceptance_criteria` is not null/empty |
| **Testable** | Contains Given/When/Then language, or explicit pass/fail conditions |
| **Specific** | Title names a concrete deliverable, not a vague action ("implement X") |
| **Sized** | Fewer than 6 acceptance criteria bullets — if more, flag for splitting |
| **Independent** | Can be built and verified without assuming another story is in progress |

Record your findings before making any changes.

---

### Step 3 — Refine acceptance criteria

For any story that fails the audit, rewrite its `acceptance_criteria` using this structure:

```
**Happy path**
Given [starting context], When [user/system action], Then [observable, verifiable outcome].

**Edge cases** (include any that are load-bearing for the implementation)
Given [boundary condition], When [action], Then [specific behaviour].

**Error states** (only if the story involves I/O, external calls, or user input)
Given [invalid input or failure mode], When [action], Then [error is handled as follows].
```

Rules:
- Every scenario must be independently verifiable by a developer or agent with no additional context.
- Do not prescribe implementation — describe observable outcomes only.
- If the story is too large to fit in Given/When/Then without more than 5 scenarios, split it. Add a comment in your report but do not split automatically — flag it for the user.

Apply the INVEST principles as a final check:
- **I**ndependent — no implicit ordering with sibling stories
- **N**egotiable — scope can be adjusted without breaking other stories
- **V**aluable — delivers something observable
- **E**stimable — a developer can size it
- **S**mall — completable in one sprint
- **T**estable — acceptance criteria are pass/fail verifiable

Write improved acceptance criteria back to the database:

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.workItem.update({ where: { id: 'WORK_ITEM_ID' }, data: { acceptance_criteria: \`REFINED_AC\` } }).then(() => p.\$disconnect());
"
```

---

### Step 4 — Infer dependencies

Analyse all stories in scope and identify sequencing constraints. A story B **depends_on** story A when B cannot be built or verified without A being done first. Common signals:

- B's acceptance criteria reference a schema field, model, or API route that A creates
- B tests or extends something that A introduces
- B's Given context assumes an entity that A produces

A story A **blocks** story B when A must be merged before B can begin (equivalent to B depends_on A — use `depends_on` on B rather than `blocks` on A unless the blocker is external).

Write each inferred relationship to the database:

```bash
npx tsx -e "
import { PrismaClient, RelationshipType } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const prod = await p.product.findFirst({ where: { slug: 'product-os' }, select: { id: true } });
  await p.relationship.createMany({
    data: [
      // { product_id: prod!.id, from_work_item_id: 'B_ID', to_work_item_id: 'A_ID', relationship_type: RelationshipType.depends_on },
    ],
    skipDuplicates: true,
  });
}
main().finally(() => p.\$disconnect());
"
```

---

### Step 5 — Mark first wave as `ready`

Stories are ready to start when they have no `depends_on` relationships pointing to unfinished work.

```bash
npx tsx -e "
import { PrismaClient, WorkItemStatus } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const prod = await p.product.findFirst({ where: { slug: 'product-os' }, select: { id: true } });
  // Find stories with no depends_on edges where the dependency is not yet done
  const allStories = await p.workItem.findMany({
    where: { product_id: prod!.id, status: 'new', type: { in: ['story','task'] } },
    include: { incoming_relationships: { where: { relationship_type: 'depends_on' }, include: { from_work_item: { select: { status: true } } } } }
  });
  // A story is ready if it has no depends_on relationships, OR all its dependencies are done
  const readyIds = allStories
    .filter(s => s.incoming_relationships.length === 0)
    .map(s => s.id);
  await p.workItem.updateMany({ where: { id: { in: readyIds } }, data: { status: WorkItemStatus.ready } });
  console.log('Marked ready:', readyIds.length, 'stories');
}
main().finally(() => p.\$disconnect());
"
```

Wait — review the list of stories that will be marked `ready` before running the update. Confirm it matches the expected first wave before proceeding.

---

### Step 6 — Output a refinement report

End every refinement run with a structured summary:

```
## Refinement report — [scope] — [date]

### Stories improved
- [title]: [what changed — e.g. "AC rewritten to Given/When/Then, 3 scenarios added"]

### Dependencies wired
- [story B title] depends_on [story A title]
- ...

### Marked ready ([count])
- [title]
- ...

### Blocked — awaiting dependencies
- [title] → waiting on: [dependency title]
- ...

### Flagged for attention
- [title]: [issue — e.g. "too large, suggest splitting at X boundary"]
```

---

## Notes

- This skill writes directly to the SQLite database. Changes are immediate — no staging.
- Run `npx tsx prisma/seed-execution-engine.ts` first if the Layer 2 plan hasn't been seeded yet.
- The product slug is `product-os`. Pass a different slug via the database query if working on another product.
- For stories that need splitting, do not split automatically. Flag in the report and let the user decide.
