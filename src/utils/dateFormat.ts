export const formatToMonthYear = (timestamp: any) => {
  const date = new Date(timestamp.seconds * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
};
