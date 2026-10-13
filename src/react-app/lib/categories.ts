// "Other" is the catch-all: it always sits last among the tags, and a deleted tag's entries move into it.
export const OTHER = "Other";

export const otherLast = (names: string[]): string[] => [...names.filter((name) => name !== OTHER), ...names.filter((name) => name === OTHER)];
