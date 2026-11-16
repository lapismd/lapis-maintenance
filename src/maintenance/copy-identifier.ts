/** Host clipboard port invoked only by an explicit identifier activation. */
export async function copyIdentifier(value: string): Promise<void> {
  if (!navigator.clipboard?.writeText)
    throw new Error("Clipboard is unavailable");
  await navigator.clipboard.writeText(value);
}
