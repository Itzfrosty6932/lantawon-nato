"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { ISO_COUNTRIES, CountryEntry } from "@/lib/constants/taxonomies";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";

export function RegionSwitcher() {
  const [selectedCountry, setSelectedCountry] = useState<CountryEntry>(
    ISO_COUNTRIES[0] // Defaults to PH
  );
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("preferred_country_code");
    if (saved) {
      const match = ISO_COUNTRIES.find((c) => c.code === saved);
      if (match) setSelectedCountry(match);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (country: CountryEntry) => {
    setSelectedCountry(country);
    localStorage.setItem("preferred_country_code", country.code);
    setIsOpen(false);
    audioFX.playClick();
    showToast(`Streaming region set to ${country.name} (${country.code})`, "info");
    // Trigger custom event for components listening to region changes
    window.dispatchEvent(new CustomEvent("region_changed", { detail: country.code }));
  };

  return (
    <div ref={dropdownRef} className="relative select-none">
      <button
        type="button"
        onClick={() => {
          audioFX.playPop();
          setIsOpen((prev) => !prev);
        }}
        className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg bg-[#242526] hover:bg-[#3a3b3c] flex items-center gap-1 sm:gap-1.5 text-zinc-300 hover:text-white transition-all cursor-pointer border border-zinc-700/80 shrink-0 font-medium"
        title="Streaming Region"
      >
        <span className="text-[11px] sm:text-xs font-mono font-bold text-white tracking-wider">{selectedCountry.code}</span>
        <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform hidden sm:block ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 max-h-72 overflow-y-auto bg-[#181818] border border-zinc-700/80 rounded-xl p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-zinc-700">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800 mb-1">
            Streaming Region
          </div>
          {ISO_COUNTRIES.map((country) => {
            const isSelected = selectedCountry.code === country.code;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#E31937] text-white font-bold"
                    : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`font-mono font-bold text-[11px] ${isSelected ? "text-white" : "text-zinc-400"} w-6 text-left shrink-0`}>
                    {country.code}
                  </span>
                  <span className="truncate">{country.name}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-white shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
