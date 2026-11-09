/** JSON.stringify leaves `</script>` intact, which would let stored text break out of the tag. */
export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
