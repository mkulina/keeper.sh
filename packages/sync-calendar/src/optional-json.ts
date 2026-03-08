const parseOptionalJsonObject = (value: string | null): object | null => {
  if (value === null) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(value);
    if (parsedValue !== null && typeof parsedValue === "object") {
      return parsedValue;
    }
    return null;
  } catch {
    return null;
  }
};

export { parseOptionalJsonObject };
