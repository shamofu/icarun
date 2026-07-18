// Minimal shared theme tokens for the icarun UI.
export const colors = {
  bg: "#0b0d12",
  surface: "#161a22",
  surfaceAlt: "#1f2530",
  border: "#2a3140",
  text: "#e6e9ef",
  textMuted: "#9aa4b2",
  primary: "#4c8bf5",
  danger: "#e5484d",
  success: "#30a46c",
  warning: "#f5a623"
};

export const priorityColor: Record<string, string> = {
  low: colors.textMuted,
  medium: colors.primary,
  high: colors.warning
};

export const statusLabel: Record<string, string> = {
  todo: "ToDo",
  in_progress: "In Progress",
  done: "Done",
  archived: "Archived"
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24
};