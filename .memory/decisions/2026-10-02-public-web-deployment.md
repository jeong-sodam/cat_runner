# Decisions: Public Web Deployment

- Date: 2026-10-02
- Status: Confirmed

## D01. Hosting platform
- **Chosen**: Deploy the existing Node.js/Express application as a Render web service.
- **Rationale**: Render provides a simple path from the existing GitHub repository to a public browser URL without requiring visitors to install VS Code or run the project locally.

## D02. Initial hosting cost
- **Chosen**: Start on Render's free web service plan.
- **Rationale**: The first goal is to make the existing browser-local game publicly playable without a hosting charge. Accept the free plan's limits: the service can sleep after inactivity, cold starts can take about a minute, and its filesystem is ephemeral.

## D03. Deployment source and updates
- **Chosen**: Connect the existing GitHub repository and automatically deploy updates from the `main` branch only after linked CI checks pass (`checksPass`).
- **Rationale**: This keeps the public version updated when changes reach the main branch and ensures the configured compatibility checks pass before deployment. This supersedes the original commit-trigger-only behavior.

## D04. Initial gameplay and score storage
- **Chosen**: Keep the current no-account browser-local gameplay. Personal records remain in each player's browser; do not add shared rankings in this deployment task.
- **Rationale**: This is already the available UI flow and does not rely on the ephemeral server-side SQLite data for gameplay or personal records.
- **Future**: Shared rankings and their required account and persistent-storage work may be considered as a later feature.

## D05. Public URL and custom domain
- **Chosen**: Use the free Render-provided `onrender.com` URL initially.
- **Rationale**: No separately purchased domain is needed to share the game. Connecting a custom domain can be considered later.
