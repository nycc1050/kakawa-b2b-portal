"use client";

import { useState } from "react";
import Papa from "papaparse";
import {
  uploadProductsCsv,
  type CsvUploadResult,
  type ProductCsvRow,
} from "./actions";

const COLUMNS = ["title", "sku", "category", "b2c_price", "variant_title", "weight"];

export default function ProductCsvUploadPage() {
  const [rows, setRows] = useState<ProductCsvRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CsvUploadResult | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setParseError(null);
    setResult(null);

    Papa.parse<ProductCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const missing = COLUMNS.filter((c) => !headers.includes(c));
        if (missing.length > 0) {
          setParseError(`Missing column(s): ${missing.join(", ")}`);
          setRows([]);
          return;
        }
        setRows(results.data);
      },
      error: (err) => setParseError(err.message),
    });
  }

  async function handleUpload() {
    setUploading(true);
    try {
      const res = await uploadProductsCsv(rows);
      setResult(res);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Product CSV Upload</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Columns required: <code>{COLUMNS.join(", ")}</code>. Rows sharing the same{" "}
        <code>title</code> (case-insensitive) become variants of one product. Existing
        products are matched by title; variants are matched by SKU when provided.
      </p>

      <div className="mt-6 max-w-xl">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
        />

        {parseError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {parseError}
          </p>
        )}

        {fileName && !parseError && rows.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-neutral-700">
              Parsed <strong>{rows.length}</strong> row(s) from {fileName}.
            </p>
            <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-neutral-200">
              <table className="w-full text-xs">
                <thead className="bg-neutral-50">
                  <tr>
                    {COLUMNS.map((c) => (
                      <th key={c} className="px-2 py-1.5 text-left font-medium text-neutral-500">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="border-t border-neutral-100">
                      {COLUMNS.map((c) => (
                        <td key={c} className="px-2 py-1.5 text-neutral-700">
                          {r[c as keyof ProductCsvRow]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 20 && (
              <p className="mt-1 text-xs text-neutral-400">
                Showing first 20 of {rows.length} rows.
              </p>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="mt-4 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : `Upload ${rows.length} rows`}
            </button>
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <p className="font-medium text-neutral-900">Upload complete</p>
            <ul className="mt-2 space-y-1 text-neutral-700">
              <li>Products created: {result.productsCreated}</li>
              <li>Products matched (existing): {result.productsMatched}</li>
              <li>Variants created: {result.variantsCreated}</li>
              <li>Variants updated: {result.variantsUpdated}</li>
            </ul>
            {result.errors.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-red-600">
                  {result.errors.length} row(s) had errors:
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-red-600">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
