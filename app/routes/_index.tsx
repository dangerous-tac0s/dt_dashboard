import { json } from "@remix-run/node"; // if you're on Remix v2, this is the same import
import { MetaFunction, useLoaderData, useNavigate } from "@remix-run/react";
import rawData from "implants.json";
// Recharts
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  // Label prop can be used for axis labeling if you like
} from "recharts";
import { useState } from "react";

// TODO: Fix the typing here...
export const colorPalette45: string[] = [
  "#2e1d9c",
  "#351e2f",
  "#364e1c",
  "#552e9d",
  "#563653",
  "#596da5",
  "#69655a",
  "#693c1b",
  "#44366a",
  "#9e6036",
  "#8e6b8f",
  "#7a71d0",
  "#608110",
  "#9695d6",
  "#405906",
  "#62acb6",
  "#a5aa30",
  "#c582c2",
  "#bfaba9",
  "#66d915",
  "#8dc367",
  "#c0dba5",
  "#403510",
  "#b74979",
  "#c6c23c",
  "#caa992",
  "#91cce9",
  "#b1d05e",
  "#73328d",
  "#d65f2c",
  "#747794",
  "#ce9b54",
  "#aa7ce3",
  "#dfaedb",
  "#b7c9ce",
  "#798346",
  "#d4d95f",
  "#e6c9c0",
  "#8b9562",
  "#92dfb0",
  "#d07baf",
  "#4a8b82",
  "#e1b437",
  "#e4917a",
  "#ebd860",
  "#8e506b",
];

function getMonthName(monthNumber: number) {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString("default", { month: "long" });
}

/**
 * Takes in a string such as 2024-direct and returns 2024 Direct
 * @param name
 */
function formatString(name: string) {
  const regexp = /[-_]/g;
  const chunked = name.split(regexp);
  const capitalized = chunked.map(
    (ea) => ea.charAt(0).toUpperCase() + ea.substr(1).toLowerCase(),
  );
  return capitalized.join(" ");
}

function floatToLocalizedPercentage(value: number, decimals = 2) {
  const userLocale =
    navigator.languages && navigator.languages.length
      ? navigator.languages[0]
      : navigator.language;
  return new Intl.NumberFormat(userLocale, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

/* =====================
   1) Remix Loader
   ===================== */
export async function loader() {
  // In a real app, you might read from fs or fetch from a DB
  // For now, we simply return the local JSON import:
  return json(rawData);
}

/* =====================
   2) Shared Helpers
   ===================== */
function sumObject(obj = {}) {
  return Object.values(obj).reduce((acc, val) => acc + val, 0);
}

/**
 * getOrZero(obj, key) - safely returns obj[key] or 0
 */
// function getOrZero(obj, key) {
//   return obj[key] || 0;
// }

/**
 * mergeProductCounts(target, productName, amount, category)
 *   - Merges `amount` into `target[productName][category]`.
 *     For example, if category="direct", we add `amount` to target[productName].direct.
 */
function mergeProductCounts(
  target: {
    [key: string]: { [key: string]: number };
  },
  productName: string,
  amount: number,
  category: string,
) {
  if (!target[productName]) {
    target[productName] = { direct: 0, resellers: 0, partners: 0 };
  }
  target[productName][category] += amount;
}

/* =====================
   3) Transform for "Overall" or "Single-Year"
   => One bar per product, stacked by direct/resellers/partners
   ===================== */

/**
 * transformOverallByProduct(overallObj)
 *   Summation of all products (across all time) with direct/resellers/partners.
 *   Returns an array: [ { product: "DT NExT", direct: 2818, resellers: 169, partners: 185 }, ...]
 */
function transformOverallByProduct(overallObj) {
  // overallObj has { direct: {...}, resellers: {...}, partners: {...} } by product
  const productMap = {} as {
    [key: string]: { direct: number; resellers: number; partners: number };
  };

  // Merge direct
  for (const [prod, amt] of Object.entries(overallObj.direct || {})) {
    mergeProductCounts(productMap, prod, amt, "direct");
  }
  // Merge resellers
  for (const [prod, amt] of Object.entries(overallObj.resellers || {})) {
    mergeProductCounts(productMap, prod, amt, "resellers");
  }
  // Merge partners
  for (const [prod, amt] of Object.entries(overallObj.partners || {})) {
    mergeProductCounts(productMap, prod, amt, "partners");
  }

  // Convert productMap to array
  return Object.entries(productMap).map(([product, cat]) => ({
    product,
    direct: cat.direct,
    resellers: cat.resellers,
    partners: cat.partners,
  }));
}

/**
 * transformSingleYearByProduct(yearObj)
 *   Merges all months in that year, summing product counts
 *   Returns same shape as transformOverallByProduct => [ { product, direct, resellers, partners }, ... ]
 */
function transformSingleYearByProduct(yearObj) {
  if (!yearObj) return [];

  const productMap = {}; // same structure as above

  // yearObj shape: { "1": {direct: {...}, resellers: {...}, partners: {...}}, "2": {...}, ... }
  for (const monthData of Object.values(yearObj)) {
    // Merge direct
    for (const [prod, amt] of Object.entries(monthData.direct || {})) {
      mergeProductCounts(productMap, prod, amt, "direct");
    }
    // Merge resellers
    for (const [prod, amt] of Object.entries(monthData.resellers || {})) {
      mergeProductCounts(productMap, prod, amt, "resellers");
    }
    // Merge partners
    for (const [prod, amt] of Object.entries(monthData.partners || {})) {
      mergeProductCounts(productMap, prod, amt, "partners");
    }
  }

  // Convert to array
  return Object.entries(productMap).map(([product, cat]) => ({
    product,
    direct: cat.direct,
    resellers: cat.resellers,
    partners: cat.partners,
  }));
}

/* =====================
   4) Transform for Multiple-Years => Grouped by Month,
      each bar is "stacked" for direct/resellers/partners,
      and each year's bar is next to the others in that month group
   ===================== */

/**
 * transformMultiYearByMonth(dataObj, yearList)
 *
 * We want up to 12 "groups" (Jan..Dec). For each group (month), we have one "stack" per year.
 * We'll create 12 data rows, shaped like:
 *
 * [
 *   {
 *     month: "1",
 *     "2019-direct": 10,
 *     "2019-resellers": 5,
 *     "2019-partners": 2,
 *     "2020-direct": 8,
 *     ...
 *   },
 *   { month: "2", ...},
 *   ...
 *   { month: "12", ... }
 * ]
 */
function transformMultiYearByMonth(dataObj, yearList) {
  // We'll build a placeholder array of 12 objects, each with { month: "1".."12" }.
  const rows = Array.from({ length: 12 }, (_, i) => ({
    month: String(i + 1), // "1".."12"
  }));

  const sortedYearList = yearList.sort((a, b) => a - b);

  // We'll index them by month in a quick map for easy updates:
  const rowMap = {};
  rows.forEach((row) => {
    rowMap[row.month] = row;
  });

  // For each year in yearList, sum up each (direct, resellers, partners) for each month
  for (const year of sortedYearList) {
    const yearObj = dataObj[year];
    if (!yearObj) continue;
    // yearObj => { "1": { direct, resellers, partners }, "2": {...}, ... }

    for (let m = 1; m <= 12; m++) {
      const mStr = String(m);
      const monthData = yearObj[mStr];
      if (!monthData) continue;

      const directSum = sumObject(monthData.direct);
      const resellerSum = sumObject(monthData.resellers);
      const partnerSum = sumObject(monthData.partners);

      // We'll store them as "YYYY-direct", "YYYY-resellers", "YYYY-partners"
      rowMap[mStr][`${year}-direct`] = directSum;
      rowMap[mStr][`${year}-resellers`] = resellerSum;
      rowMap[mStr][`${year}-partners`] = partnerSum;
    }
  }

  return rows;
}

/* =====================
   5) Custom Tooltips & Axis Ticks
   ===================== */

// Simple custom tooltip: shows label + each dataKey’s name + value
function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #ccc",
        padding: 8,
        color: "black",
      }}
    >
      <strong>{formatter ? formatter(label) : label}</strong>
      <ul style={{ margin: 0, paddingInlineStart: 20 }}>
        {payload.map((entry) => (
          <li key={entry.dataKey} style={{ color: entry.color }}>
            {formatString(entry.dataKey)}:{" "}
            {floatToLocalizedPercentage(entry.value)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Example axis tick style for smaller font & angled text
const xAxisTickStyle = {
  fontSize: 10,
  angle: -45,
  textAnchor: "end",
};

export const meta: MetaFunction = () => {
  return [
    { title: "Dangerous Dashboard" },
    {
      name: "description",
      content: "Informing Dangerous Decisions Since 2025",
    },
  ];
};

type ChartDataItem = {
  product: string;
  direct: number;
  resellers: number;
  partners: number;
};

interface MyChartProps {
  data: ChartDataItem[];
}

export default function Index() {
  const navigate = useNavigate();
  const dataObj = useLoaderData(); // { overall, "2019": {...}, "2020": {...}, ... }
  const allYears = Object.keys(dataObj).filter((k) => k !== "overall"); // e.g. ["2019","2020",...]

  const [selectedYears, setSelectedYears] = useState([]);
  const [mode, setMode] = useState("overall");
  // modes: "overall", "year" (we'll allow single or multi-year in that same mode)

  // Checkbox change
  function handleYearChange(e) {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedYears((prev) => [...prev, value]);
    } else {
      setSelectedYears((prev) => prev.filter((yr) => yr !== value));
    }
  }

  // A single handler for all bars
  const handleBarClick = (dataItem: ChartDataItem, index: number) => {
    // Navigate to /mod/<productName>
    navigate(`/mod/${encodeURIComponent(dataItem.product)}`);
  };

  // Decide chart data
  let chartElement = null;

  // SINGLE stacked bar chart:
  // -> actually multiple bars, one per "product," stacked by direct/resellers/partners
  const data = transformOverallByProduct(dataObj[mode]);
  chartElement = (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 20, left: 20, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="product"
          tick={xAxisTickStyle}
          interval={0} // show all ticks
        />
        <YAxis tickFormatter={floatToLocalizedPercentage} />
        <Tooltip content={<CustomTooltip />} />
        {/*<Legend verticalAlign="top" align="center" />*/}
        <Bar dataKey="direct" onClick={handleBarClick}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={colorPalette45[index % colorPalette45.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  /* =====================
     Render the page
  ===================== */
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Dangerous Dashboard</h1>

      {/* Mode radio buttons */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: "1rem" }}>
          <input
            type="radio"
            name="mode"
            value="overall"
            checked={mode === "overall"}
            onChange={() => setMode("overall")}
          />
          Overall
        </label>
        {allYears.map((yr) => (
          <label key={yr} style={{ display: "inline-block", marginRight: 8 }}>
            <input
              name="mode"
              type="radio"
              value={yr}
              checked={mode === yr}
              onChange={() => setMode(yr)}
            />
            {yr}
          </label>
        ))}
      </div>

      {/* The chart */}
      {chartElement}
    </div>
  );
}
