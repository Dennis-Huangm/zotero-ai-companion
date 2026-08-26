export function joinPlatformPath(directory: string, filename: string): string {
  if (!directory) return filename;
  if (directory.endsWith("/") || directory.endsWith("\\")) {
    return `${directory}${filename}`;
  }
  const separator = directory.includes("\\") ? "\\" : "/";
  return `${directory}${separator}${filename}`;
}
