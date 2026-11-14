<script lang="ts">
  import * as Field from "@lapismd/design-core/shadcn/field";
  import { Input } from "@lapismd/design-core/shadcn/input";
  import DispatchSelect from "./DispatchSelect.svelte";
  import type { DispatchController } from "../../maintenance/dispatch/controller.svelte";
  let { controller }: { controller: DispatchController } = $props();
  const prefix = $props.id();
</script>

<Field.FieldGroup>
  {#each controller.target?.inputs ?? [] as input}
    <Field.Field
      ><Field.FieldLabel for={`${prefix}-${input.name}`}
        >{input.name}{input.required ? " *" : ""}</Field.FieldLabel
      >
      {#if ["choice", "environment", "boolean"].includes(input.type)}<DispatchSelect
          id={`${prefix}-${input.name}`}
          label={`Choose ${input.name}`}
          value={controller.values[input.name] ?? ""}
          options={(input.type === "boolean"
            ? ["false", "true"]
            : input.type === "environment"
              ? (controller.target?.environments ?? [])
              : (input.options ?? [])
          ).map((v) => ({ value: v, label: v }))}
          disabled={controller.pending}
          onChange={(value) =>
            (controller.values = { ...controller.values, [input.name]: value })}
        />
      {:else}<Input
          id={`${prefix}-${input.name}`}
          type={input.type === "number" ? "number" : "text"}
          step={input.type === "number" ? "any" : undefined}
          value={controller.values[input.name] ?? ""}
          required={input.required}
          disabled={controller.pending}
          oninput={(event) =>
            (controller.values = {
              ...controller.values,
              [input.name]: event.currentTarget.value,
            })}
        />{/if}
      <Field.FieldDescription>{input.description}</Field.FieldDescription
      ></Field.Field
    >
  {/each}
</Field.FieldGroup>
