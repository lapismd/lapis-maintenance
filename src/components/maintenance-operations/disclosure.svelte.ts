import { getContext } from "svelte";
import { SvelteMap } from "svelte/reactivity";
export const operationsDisclosureKey = Symbol("operations-disclosures");
export class OperationsDisclosures {
  value = $state<boolean>();
  generation = $state(0);
  states = new SvelteMap<symbol, boolean>();
  get anyOpen() {
    return [...this.states.values()].some(Boolean);
  }
  toggleAll() {
    this.value = !this.anyOpen;
    this.generation++;
  }
}
/** Local choices survive until the next explicit fold/expand-all activation. */
export function useOperationsDisclosure(defaultOpen: () => boolean) {
  const group = getContext<OperationsDisclosures | undefined>(
    operationsDisclosureKey,
  );
  const id = Symbol();
  let choice = $state<{ generation: number; value: boolean }>();
  const open = $derived(
    choice?.generation === (group?.generation ?? 0)
      ? choice.value
      : (group?.value ?? defaultOpen()),
  );
  $effect(() => {
    group?.states.set(id, open);
    return () => {
      group?.states.delete(id);
    };
  });
  return {
    get open() {
      return open;
    },
    set open(value: boolean) {
      choice = { generation: group?.generation ?? 0, value };
    },
  };
}
