<script lang="ts">
  import * as Select from "@lapismd/design-core/shadcn/select";
  let {
    id,
    label,
    value,
    options,
    disabled = false,
    onChange,
  }: {
    id: string;
    label: string;
    value: string;
    options: { value: string; label: string }[];
    disabled?: boolean;
    onChange: (value: string) => void;
  } = $props();
</script>

<Select.Root type="single" {value} {disabled} onValueChange={onChange}>
  <Select.Trigger {id} aria-label={label} style="width:100%"
    >{options.find((o) => o.value === value)?.label ?? label}</Select.Trigger
  >
  <Select.Content
    ><Select.Group
      >{#each options as option}<Select.Item
          value={option.value}
          label={option.label}>{option.label}</Select.Item
        >{/each}</Select.Group
    ></Select.Content
  >
</Select.Root>
