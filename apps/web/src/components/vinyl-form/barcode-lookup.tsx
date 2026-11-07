"use client";

import { Button } from "@dallateas/ui/components/button";
import { useState } from "react";

import { ScannerButton } from "@/components/barcode-scanner";

import { actionClass, controlClass, Field } from "./field";

type BarcodeLookupProps = {
  isSearching: boolean;
  onSearch: (code: string) => void;
  onScan: (code: string) => void;
};

export function BarcodeLookup({ isSearching, onSearch, onScan }: BarcodeLookupProps) {
  const [code, setCode] = useState("");

  function search() {
    if (code.trim()) onSearch(code);
  }

  return (
    <Field label="Código de barras" htmlFor="barcode-search">
      <div className="flex gap-2">
        <input
          id="barcode-search"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              search();
            }
          }}
          placeholder="Escaneá o escribí el código"
          inputMode="numeric"
          className={controlClass}
        />
        <ScannerButton
          onScan={(scanned) => {
            setCode(scanned);
            onScan(scanned);
          }}
        />
        <Button type="button" variant="outline" className={actionClass} disabled={!code.trim() || isSearching} onClick={search}>
          Buscar
        </Button>
      </div>
    </Field>
  );
}
