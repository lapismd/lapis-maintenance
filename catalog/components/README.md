# Production component stories

Each family names the production component in Storybook metadata. ComponentDemo
owns disposable in-memory ports, controller and shell lifetimes; it does not
copy component markup. MaintenanceScreen composes MaintenanceToolbar,
MaintenanceInbox, MaintenanceNavigation and MaintenanceInspector. Those reuse the
same board, filters, summary, profile, details and action components shown here.

PR checks are supplied through RepositoryReview to RepositoryPullRequest;
workflow and approval panels compose RepositoryForgePanel and supply results
through MaintenanceChecks. Both paths
compose the public RepositoryChecks family from Repository UI, using one shared
checkSnapshot mapping. No old private list remains in any story.

These component stories remain fixture-only and visual-pending. Token login
stories use invented input and a no-op callback. The separate local-development
Live/GitHub session story mounts the production app for user-entered token
acceptance; it is excluded from published builds and automated discovery.
