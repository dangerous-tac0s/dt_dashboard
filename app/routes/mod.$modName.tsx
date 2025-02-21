import { useLoaderData } from "@remix-run/react";
import { ALL_MODS, Mod } from "~/resources/models";
import { useState } from "react";

/**
 * Loader: fetch the Mod object from ALL_MODS
 * @param param0
 * @returns
 */
export async function loader({ params }: { params: { modName: string } }) {
  // "modName" is the dynamic param from the filename [mod.$modName].tsx
  const { modName } = params;

  if (!modName) {
    throw new Response("Mod name param missing", { status: 400 });
  }
  if (modName === "installMap.js") {
    return;
  }

  return modName;
}

/**
 * A simple default export component that shows
 * the mod data, or does something interesting with it.
 */
export default function ModDetailRoute() {
  // loader returns a `Mod`
  const modData = useLoaderData<string>();
  const [mod] = useState<Mod>(ALL_MODS[modData]);
  // console.log(modData);
  // console.log(modData.rfid);
  const features: { key: string; value: string | boolean }[] = [];
  if (mod) {
    Object.entries(mod).forEach(([key, value]) => {
      if (key !== "chip" && key !== "name") {
        if (value) {
          features.push({
            key,
            value: value as string | boolean,
          });
        }
      }
    });
    return (
      <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
        <h1>{mod.name}</h1>
        <br />
        <ul>
          {features.map((entry, i) => (
            <li key={i}>
              {entry.key}: {entry.value.toString()}
            </li>
          ))}
          {mod.rfid ? <li>RFID: {mod.rfid.toString()}</li> : ""}
        </ul>
        <br />
        <p>
          <strong>Chips:</strong>
        </p>
        {mod.chip.length > 0 ? (
          <ul>
            {mod.chip.map((chip, i) => (
              <li key={i}>{chip.name}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
}
