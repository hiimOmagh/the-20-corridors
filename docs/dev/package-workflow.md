# Package Workflow

## Delivery rule

Every update is delivered as a ZIP package.

Each ZIP contains only:

- new files
- modified files
- cleanup scripts when deletion is required
- a manifest describing the change

Unchanged files must not be included in update packages after the initial bootstrap package.

## Required manifest

Every package must include:

```text
docs/dev/update-manifest.md
```

The manifest must state:

- package name
- phase
- purpose
- files included
- files intentionally not included
- apply instructions
- validation steps
- next recommended milestone

## Deletion rule

If files need to be deleted, include a cleanup script that:

1. deletes only the required stale files
2. prints what it deleted
3. self-removes when possible

## No Codex by default

Do not generate Codex prompts or delegate to Codex unless explicitly requested.

## Apply pattern

From repository root:

```bash
unzip <package>.zip
```

Then review:

```bash
git status --short
```

Commit with a precise message:

```bash
git add .
git commit -m "docs: lock phase 0 methodology foundation"
```
