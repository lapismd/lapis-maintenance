import {
  defineConfig,
  headingRequirements,
  singleIdVerification,
} from "@lapismd/spec-validator";
export default defineConfig(headingRequirements(), {
  name: "lapis-maintenance",
  idPattern: /^LM-[A-Z]+-\d{3}$/,
  ruleIds: {
    summary: "LM-GOV-001",
    governance: "LM-GOV-001",
    verification: "LM-GOV-001",
    book: "LM-GOV-001",
    bookIgnore: "LM-GOV-001",
    qmd: "LM-GOV-001",
    markdownlint: "LM-GOV-001",
    specFirst: "LM-GOV-001",
    internal: "LM-GOV-001",
  },
  validators: {
    summary: true,
    governance: { extras: ["AGENTS.md", "PLAN.md", "README.md"] },
    verification: {
      ...singleIdVerification(),
      statuses: ["Planned", "Pending", "In progress", "Implemented"],
      statusMatch: "exact",
    },
    book: true,
    qmd: { collection: "lapis-maintenance-spec" },
    markdownlint: { config: ".markdownlint-cli2.jsonc" },
    specFirst: {
      mode: "mapped",
      protected: [
        "^src/",
        "^catalog/",
        "^\\.storybook/",
        "^\\.github/",
        "^scripts/",
        "^(?:package\\.json|pnpm-lock\\.yaml|.*config\\.(?:ts|js)|AGENTS\\.md)$",
      ],
      ignore: ["\\.(?:test|stories)\\.ts$"],
      rules: [
        {
          pattern: "^src/(?:github|session)/",
          chapters: ["spec/src/github.md"],
        },
        { pattern: "^src/cache/", chapters: ["spec/src/cache.md"] },
        {
          pattern: "^src/",
          chapters: ["spec/src/dashboard.md", "spec/src/controller.md"],
        },
        {
          pattern: "^catalog/|^\\.storybook/",
          chapters: ["spec/src/dashboard.md"],
        },
        {
          pattern:
            "^\\.github/|^scripts/|^(?:package\\.json|pnpm-lock\\.yaml|.*config\\.(?:ts|js)|AGENTS\\.md)$",
          chapters: ["spec/src/governance.md"],
        },
      ],
    },
  },
  check: {
    lanes: [
      {
        name: "source-boundaries",
        command: "pnpm",
        args: ["run", "check:architecture"],
      },
    ],
    build: true,
    first: true,
  },
});
