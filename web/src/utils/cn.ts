export const cn = (...parts: Array<string | undefined | null | false>) =>
  parts.filter(Boolean).join(" ");

export default cn;
