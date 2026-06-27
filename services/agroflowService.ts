
export async function getFarmData(location: string) {
  const response = await fetch(
    `http://127.0.0.1:5000/api/location?location=${location}`
  );

  return await response.json();
}