/** Invented PR text: mirrors common GitHub formatting without live repository data. */
export const reviewMarkdown = `<!-- preview-profile-context:start -->
### Package publication context

**Three package updates** are ready for review. See the [package registry](https://www.npmjs.com/package/example-package).

| Package | Before | After |
| --- | --- | --- |
| example-docs | 0.2.2 | 0.3.0 |
| example-tasks | 0.2.0 | 0.2.1 |
| example-validator | 0.2.0 | 0.2.1 |

- [x] Validate the recorded package versions
- [ ] Review the release notes

> This timestamp records validation, not publication.

\`\`\`sh
pnpm install --frozen-lockfile
\`\`\`

[Unsafe link](javascript:alert('fixture-only'))
<script data-fixture-script>throw new Error('This must remain inert')</script>
<!-- preview-profile-context:end -->`;
