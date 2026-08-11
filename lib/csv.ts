// Converts an array of objects into a downloadable CSV file.
// No library needed — CSV is just comma-separated text with a header row.
export function downloadCSV(filename: string, rows: Record<string, string | number | boolean | null>[]) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);

  // Escape values containing commas, quotes, or newlines per CSV spec
  const escape = (value: unknown) => {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");

  // Trigger a browser download without needing a server round-trip
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}