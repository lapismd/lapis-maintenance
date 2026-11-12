import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import MaintenanceDemo from "./MaintenanceDemo.svelte";
import ComponentDemo from "./ComponentDemo.svelte";

export default {
  title: "Maintenance/Fullscreen rendering",
  component: MaintenanceDemo,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Fixture-only reproduction for wide-window paint failures: 130 cards, a long Activity lane, and the production joined inspector. Compare the complete shell with the standalone board; no GitHub transport, token, or persistent cache is involved.",
      },
    },
  },
} satisfies Meta<typeof MaintenanceDemo>;
type Story = StoryObj<typeof MaintenanceDemo>;

export const WideShell: Story = {
  args: { scenario: "large-inventory", width: 1728 },
  play: async ({ canvasElement }) => {
    const c = within(canvasElement);
    await c.findByRole("button", { name: /Open card: Notebook release/ });
    await userEvent.click(
      c.getByRole("button", { name: /^Expand \d+ Activity$/ }),
    );
    const activity = c.getByRole("group", { name: "Activity" });
    const viewport = activity.querySelector<HTMLElement>(
      '.column-stack-scroll > [data-slot="scroll-area-viewport"]',
    )!;
    await waitFor(() => expect(viewport.clientHeight).toBeGreaterThan(300));
    const lastCard = {
      name: /^Open card: Version first-party packages · fixture 120\./,
    };
    await waitFor(() => {
      viewport.scrollTop = viewport.scrollHeight;
      expect(c.getByRole("button", lastCard)).toBeInTheDocument();
    });
    const card = c.getByRole("button", lastCard);
    card.scrollIntoView({ block: "center", inline: "nearest" });
    await userEvent.hover(card);
    await userEvent.click(card);
    const inspector = c.getByRole("complementary", { name: "Item inspector" });
    await expect(inspector).toBeVisible();
    await waitFor(() =>
      expect(
        inspector.querySelector(".maintenance-detail-heading h2"),
      ).toHaveTextContent("Version first-party packages · fixture 120"),
    );
    await expect(
      c.getByRole("heading", { name: "130 items in view" }),
    ).toBeVisible();
  },
};

export const StandaloneBoard: StoryObj<typeof ComponentDemo> = {
  args: { part: "board", scenario: "large-inventory" },
  render: (args) => ({
    Component: ComponentDemo,
    props: args,
  }),
};
