type Frequency = "13.56 Mhz" | "125 kHz" | "134 kHz";

type ChipUID = "4B" | "7B" | "26b" | "37b" | "40b" | "64b";

const freqMap = {
  "13.56 MHz": "NFC",
  "125 kHz": "RFID",
  "134 kHz": "RFID",
};

export interface ChipInterface {
  name: string;
  uidLength?: ChipUID[];
  frequency?: Frequency[];
  features: ChipFeaturesInterface;
}

export interface ChipFeaturesInterface {
  payment: boolean;
  ndef_capable: boolean;
  cryptographic: boolean;
  powerHarvesting: boolean;
  jcop: boolean;
  iso: ("14443a" | "14443b" | "15693" | "11784" | "11785")[];
  magic: ChipInterface[];
}

export abstract class Chip implements ChipInterface {
  _name?: string;
  _uidLength?: ChipUID;
  _frequency?: Frequency;
  _features: ChipFeaturesInterface;

  constructor() {
    this._features = {
      payment: false,
      ndef_capable: false,
      cryptographic: false,
      powerHarvesting: false,
      iso: [],
      jcop: false,
      magic: [],
    };
  }

  public get name(): string {
    return this._name ?? "";
  }

  public get uidLength(): ChipUID[] {
    if (this.magic.length > 0) {
      return Array.from([
        ...new Set(
          this.magic.map((ea: ChipInterface) => ea.uidLength).flat(Infinity),
        ),
      ]).map((ea) => {
        if (ea) {
          return ea;
        }
      }) as ChipUID[];
    } else if (this._uidLength) {
      return [this._uidLength];
    } else {
      throw new Error(`Unknown UID length: ${this._uidLength}`);
    }
  }

  public get features(): ChipFeaturesInterface {
    return this._features;
  }

  public get magic(): ChipInterface[] {
    return this.features.magic;
  }

  public get frequency(): Frequency[] {
    if (this.magic.length > 0) {
      return Array.from([
        ...new Set(
          this.magic.map((ea: ChipInterface) => ea.frequency).flat(Infinity),
        ),
      ]) as Frequency[];
    } else if (this._frequency) {
      return [this._frequency];
    } else {
      throw new Error(`Unknown frequency: ${this._frequency}`);
    }
  }
}

/*************************************
 * Example Chip Classes for T5577 Emulation
 *************************************/

// Destron
// Slix
// Hitag2048

export class USPetChip extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "US Pet Chip";
    this._uidLength = "64b"; // typical for ISO11784/11785 pet microchips
    this._frequency = "134 kHz"; // US pet microchips often operate at 134 kHz
    this._features = {
      payment: false,
      ndef_capable: false,
      cryptographic: false,
      powerHarvesting: false,
      jcop: false,
      iso: ["11784", "11785"], // not ISO14443 or 15693, but rather ISO11784/11785 for animal identification
      magic: [], // T5577 might emulate 134 kHz to simulate some pet chips
    };
  }
}

export class EM410x extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "EM410x";
    this._uidLength = "40b"; // e.g. 40-bit chip
    this._frequency = "125 kHz";
    this._features = {
      payment: false,
      ndef_capable: false,
      cryptographic: false,
      powerHarvesting: false,
      jcop: false,
      iso: [], // e.g. not ISO14443 or 15693
      magic: [],
    };
  }
}

export class HIDProx extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "HID Prox";
    this._uidLength = "26b"; // for example (HID often is 26-bit, 37-bit, etc.)
    this._frequency = "125 kHz";
    this._features = {
      payment: false,
      ndef_capable: false,
      cryptographic: false,
      powerHarvesting: false,
      jcop: false,
      iso: [],
      magic: [],
    };
  }
}

export class AWID extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "AWID";
    this._uidLength = "26b"; // placeholder
    this._frequency = "125 kHz";
    this._features = {
      payment: false,
      ndef_capable: false,
      cryptographic: false,
      powerHarvesting: false,
      jcop: false,
      iso: [],
      magic: [],
    };
  }
}

export class Indala extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "Indala";
    this._uidLength = "26b"; // placeholder
    this._frequency = "125 kHz";
    this._features = {
      payment: false,
      ndef_capable: false,
      cryptographic: false,
      powerHarvesting: false,
      jcop: false,
      iso: [],
      magic: [],
    };
  }
}

export class Keri extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "Keri";
    this._uidLength = "26b"; // placeholder
    this._frequency = "125 kHz";
    this._features = {
      payment: false,
      ndef_capable: false,
      cryptographic: false,
      powerHarvesting: false,
      jcop: false,
      iso: [],
      magic: [],
    };
  }
}

export class T5577 extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "T5577";
    this._features.magic = [
      new EM410x(),
      new HIDProx(),
      new AWID(),
      new Indala(),
      new Keri(),
      new USPetChip(),
    ];
  }
}

export class NTAG216 extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "NTAG216";
    this._uidLength = "7B";
    this._frequency = "13.56 Mhz";
    this._features.ndef_capable = true;
    this._features.iso = ["14443a"];
  }
}

export class NTAGI2C extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "NTAGI2C";
    this._uidLength = "7B";
    this._frequency = "13.56 Mhz";
    this._features.ndef_capable = true;
    this._features.iso = ["14443a"];
    this._features.powerHarvesting = true;
  }
}

export class NXPP71 extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "NXP P71";
    this._uidLength = "7B"; // Actual UID length may vary, 7 bytes is common for many advanced tags
    this._frequency = "13.56 Mhz";
    this._features = {
      payment: false, // P71 can be used for payment, but we'll set false by default
      ndef_capable: false, // depends on your usage; you can set to true if needed
      cryptographic: true, // P71 supports crypto
      powerHarvesting: false, // typically not used for energy harvesting
      jcop: true, // P71 is a JCOP platform
      iso: ["14443a"], // NXP P71 typically supports ISO14443 Type A
      magic: [],
    };
  }
}

export class MIFAREClassic4B extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "MIFARE Classic (4-byte UID)";
    this._uidLength = "4B";
    this._frequency = "13.56 Mhz";
    this._features = {
      payment: false,
      ndef_capable: false,
      cryptographic: false, // uses proprietary Crypto1, generally considered weak
      powerHarvesting: false,
      jcop: false,
      iso: ["14443a"], // partial conformance
      magic: [],
    };
  }
}

export class MIFAREClassic7B extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "MIFARE Classic (7-byte UID)";
    this._uidLength = "7B";
    this._frequency = "13.56 Mhz";
    this._features = {
      payment: false,
      ndef_capable: false,
      cryptographic: false,
      powerHarvesting: false,
      jcop: false,
      iso: ["14443a"],
      magic: [],
    };
  }
}

export class DESFireEV1 extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "MIFARE DESFire EV1";
    this._uidLength = "7B"; // typically 7-byte UID
    this._frequency = "13.56 Mhz";
    this._features = {
      payment: false, // can do payment in some configurations, set as needed
      ndef_capable: true, // EV1 can store NDEF if properly set up
      cryptographic: true, // supports AES
      powerHarvesting: false,
      jcop: false, // not a JCOP platform
      iso: ["14443a"],
      magic: [],
    };
  }
}

export class DESFireEV2 extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "MIFARE DESFire EV2";
    this._uidLength = "7B";
    this._frequency = "13.56 Mhz";
    this._features = {
      payment: false,
      ndef_capable: true,
      cryptographic: true,
      powerHarvesting: false,
      jcop: false,
      iso: ["14443a"],
      magic: [],
    };
  }
}

export class DESFireEV3 extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "MIFARE DESFire EV3";
    this._uidLength = "7B";
    this._frequency = "13.56 Mhz";
    this._features = {
      payment: false,
      ndef_capable: true,
      cryptographic: true,
      powerHarvesting: false,
      jcop: false,
      iso: ["14443a"],
      magic: [],
    };
  }
}

export class UltimateGen4 extends Chip implements ChipInterface {
  constructor() {
    super();
    this._name = "Ultimate Gen4";
    this._features.magic = [
      new NTAG216(),
      new MIFAREClassic4B(),
      new MIFAREClassic7B(),
    ];
  }
}

export interface ModMetadata {
  /** e.g., "DT NExT" */
  name: string;
  /** etc. for all boolean properties... */
  blink?: boolean;
  other_mod?: boolean;
  chip: ChipInterface[];
  magnet?: boolean;

  /** "Injectable", "Needle", "Scalpel", or "Unknown" */
  install_method?: string;
  /** "flex", "x-series", "other", or "Unknown" */
  form_factor?: string;
}

/**
 * A single dictionary: product name => ModMetadata
 * Fill this out for each known product. Here are a few examples:
 */
const PRODUCT_METADATA: Record<string, ModMetadata> = {
  "DT NExT": {
    name: "DT NExT",
    chip: [new NTAG216(), new T5577()],
    install_method: "Injectable",
    form_factor: "x-series",
    magnet: false,
  },
  "DT xEM": {
    name: "DT xEM",
    chip: [new T5577()],
    install_method: "Injectable",
    form_factor: "x-series",
    magnet: false,
  },
  "DT xNT": {
    name: "DT xNT",
    chip: [new NTAG216()],
    install_method: "Injectable",
    form_factor: "x-series",
    magnet: false,
  },
  "DT xSIID": {
    name: "DT xSIID",
    chip: [new NTAGI2C()],
    install_method: "Injectable",
    form_factor: "x-series",
    blink: true,
    magnet: false,
  },
  "DT xG3 v1": {
    name: "DT xG3 v1",
    magnet: true,
    install_method: "Injectable",
    form_factor: "x-series",
    chip: [],
  },
  "DT xG3 v2": {
    name: "DT xG3 v2",
    magnet: true,
    install_method: "Injectable",
    form_factor: "x-series",
    chip: [],
  },
  "DT TiTAN": {
    name: "DT TiTAN",
    magnet: true,
    install_method: "Scalpel",
    form_factor: "other",
    chip: [],
  },
  // Add all your other products here...
};

/*************************************
 * 2. Mod class (with precomputed data)
 *************************************/
export class Mod {
  public name: string;

  // booleans
  public blink: boolean = false;
  public magnet: boolean = false;
  public other_mod: boolean = false;
  public chip: ChipInterface[] = [];

  // strings
  public install_method: string = "Unknown";
  public form_factor: string = "Unknown";

  constructor(meta: ModMetadata) {
    this.name = meta.name;

    // Copy all booleans safely with default fallback:
    this.blink = !!meta.blink;
    this.other_mod = !!meta.other_mod;
    this.chip = meta.chip;

    // Copy strings if provided
    if (meta.install_method) {
      this.install_method = meta.install_method;
    }
    if (meta.form_factor) {
      this.form_factor = meta.form_factor;
    }
  }

  public get rfid(): boolean {
    let rfid = false;
    if (this.chip.length > 0) {
      this.chip.forEach((ch) => {
        if (!rfid) {
          if (ch.features.magic.length > 0) {
            ch.features.magic.forEach((mag) => {
              if (!rfid) {
                mag.frequency?.some((f) => {
                  rfid = Object.hasOwn(freqMap, f);
                  if (rfid) {
                    return true;
                  }
                });
              }
            });
          } else if (ch?.frequency) {
            ch?.frequency?.some((f) => {
              rfid = Object.hasOwn(freqMap, f);
              if (rfid) {
                return true;
              }
            });
          }
        }
      });
    }
    return rfid;
  }

  public get nfc(): boolean {
    let nfc = false;
    if (this.chip.length > 0) {
      this.chip.forEach((ch) => {
        if (!nfc) {
          if (ch.features.magic.length > 0) {
            ch.features.magic.forEach((mag) => {
              if (!nfc) {
                mag.frequency?.some((f) => {
                  nfc = Object.hasOwn(freqMap, f);
                  if (nfc) {
                    return true;
                  }
                });
              }
            });
          } else if (ch?.frequency) {
            ch?.frequency?.some((f) => {
              nfc = Object.hasOwn(freqMap, f);
              if (nfc) {
                return true;
              }
            });
          }
        }
      });
    }
    return nfc;
  }

  // public get dual_freq(): boolean {
  //   let nfc = false;
  //   let rfid = false;
  //   const freqs = [];
  //   this.chip.forEach((chip) => {
  //     chip.frequency.forEach((freq) => {
  //       console.log(freq);
  //       if (freqMap[freq] === "nfc") {
  //       }
  //     });
  //   });
  //   return true;
  // }

  public toString(): string {
    return this.name;
  }
  // etc. for any other logic you want
}

/*************************************
 * 3. Member class
 *    - Reuses global Mod objects
 *    - Caches repeated computations
 *************************************/
export class Member {
  // optional name
  public name?: string;
  // the user-specified mod names
  private modNames: string[] = [];
  // actual references to the global Mod objects
  private _mods: Mod[] = [];

  // Example caches
  private _implantsCache: Mod[] | null = null;
  private _duplicateImplantsCache: Record<string, number> | null = null;

  constructor(modNames: string[], name?: string) {
    this.modNames = modNames;
    if (name) {
      this.name = name;
    }
    // Reuse from ALL_MODS
    // If a name is unknown (not in ALL_MODS), handle gracefully
    this._mods = modNames.map(
      (nm) =>
        ALL_MODS[nm] ||
        new Mod({
          name: nm,
          chip: [],
          magnet: false,
          install_method: "Unknown",
        }),
    );
  }

  // Direct array of Mod objects
  public get mods(): Mod[] {
    return this._mods;
  }

  // Example: number_of_mods
  public get number_of_mods(): number {
    return this._mods.length;
  }

  // An "implants" array that excludes other_mod
  public get implants(): Mod[] {
    // caching example
    if (this._implantsCache !== null) {
      return this._implantsCache;
    }
    // compute once
    const result = this._mods.filter((m) => !m.other_mod);
    this._implantsCache = result;
    return result;
  }

  // duplicates example
  public get duplicate_implants(): Record<string, number> {
    if (this._duplicateImplantsCache !== null) {
      return this._duplicateImplantsCache;
    }
    const freq: Record<string, number> = {};
    for (const imp of this.implants) {
      freq[imp.name] = (freq[imp.name] || 0) + 1;
    }

    const duplicates: Record<string, number> = {};
    for (const productName of Object.keys(freq)) {
      if (freq[productName] > 1) {
        duplicates[productName] = freq[productName];
      }
    }
    this._duplicateImplantsCache = duplicates;
    return duplicates;
  }

  // You could define many other cached or uncached properties.
  // e.g. has_chip, has_magnet, etc.

  // If you ever need to add or remove mods, you'd reset these caches:
  // this._implantsCache = null;
  // this._duplicateImplantsCache = null;
}

/**
 * Our global map of all Mod objects: product name => single Mod instance
 */
export const ALL_MODS: Record<string, Mod> = {};

/**
 * Build the global Mod objects once.
 * In a real app, you might call this at startup or simply run it inline.
 */
function buildGlobalModMap(): void {
  for (const [productName, meta] of Object.entries(PRODUCT_METADATA)) {
    ALL_MODS[productName] = new Mod(meta);
  }
}

// Run the builder once (you could also do this in your main entry point).
buildGlobalModMap();
