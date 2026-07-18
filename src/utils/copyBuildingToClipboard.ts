import type { IBuilding } from "../interfaces/IBuilding";

export async function copyBuildingJsonToClipboard(building: IBuilding) {
  const jsonString = JSON.stringify(building, null, 2);

  try {
    // navigator.clipboard requires a secure context (HTTPS or localhost)
    await navigator.clipboard.writeText(jsonString);
    console.log("Copied JSON to clipboard:\n", jsonString);
    alert("Successfully copied building JSON to clipboard!");
  } catch (err) {
    console.error("Failed to copy text: ", err);
    alert("Failed to copy to clipboard. Check the console for errors.");
  }
}
