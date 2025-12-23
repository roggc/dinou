const useClientRegex =
  /^\s*(?:(?:\/\/[^\n]*\n\s*)|(?:\/\*[\s\S]*?\*\/\s*))*['"]use client['"]/;

const useServerRegex =
  /^\s*(?:(?:\/\/[^\n]*\n\s*)|(?:\/\*[\s\S]*?\*\/\s*))*['"]use server['"]/;

module.exports = { useClientRegex, useServerRegex };
