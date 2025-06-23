"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  selectedValues: string[];
  options: readonly string[] | readonly ComboboxOption[];
  addValue: (value: string) => void;
  removeValue: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  selectedLabelPrefix?: string;
  maxVisibleTags?: number;
}

export function Combobox({
  selectedValues,
  options,
  addValue,
  removeValue,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyStateMessage = "No items found.",
  selectedLabelPrefix = "Selected",
  maxVisibleTags = 2,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const getOptionLabel = (option: string | ComboboxOption): string => {
    return typeof option === "string" ? option : option.label;
  };

  const getOptionValue = (option: string | ComboboxOption): string => {
    return typeof option === "string" ? option : option.value;
  };

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) =>
      getOptionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="relative w-full justify-between bg-white text-left h-auto min-h-10 py-2 px-3"
          >
            <div className="flex flex-wrap items-center gap-1 pr-8 truncate">
              {selectedValues.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <>
                  {selectedValues.slice(0, maxVisibleTags).map((value) => {
                    const optionObject = options.find(
                      (opt) => getOptionValue(opt) === value
                    );
                    const displayLabel = optionObject
                      ? getOptionLabel(optionObject)
                      : value;
                    return (
                      <Badge
                        variant="secondary"
                        key={value}
                        className="font-normal"
                      >
                        {displayLabel}
                      </Badge>
                    );
                  })}
                  {selectedValues.length > maxVisibleTags && (
                    <Badge variant="default" className="font-normal">
                      +{selectedValues.length - maxVisibleTags} more
                    </Badge>
                  )}
                </>
              )}
            </div>
            <ChevronsUpDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] p-0">
          <Command shouldFilter={false} className="w-full bg-white">
            <CommandInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="border-none outline-none focus:ring-0 h-10"
              placeholder={searchPlaceholder}
            />
            {selectedValues.length > 0 && (
              <div className="border-b p-2">
                <div className="text-xs text-muted-foreground mb-1">
                  {selectedLabelPrefix} ({selectedValues.length}):
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedValues.map((value) => {
                    const optionObject = options.find(
                      (opt) => getOptionValue(opt) === value
                    );
                    const displayLabel = optionObject
                      ? getOptionLabel(optionObject)
                      : value;
                    return (
                      <Badge
                        key={value}
                        variant="outline"
                        className="flex items-center font-normal"
                      >
                        {displayLabel}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeValue(value);
                          }}
                          className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          aria-label={`Remove ${displayLabel}`}
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            <CommandList>
              {filteredOptions.length === 0 && (
                <CommandEmpty>{emptyStateMessage}</CommandEmpty>
              )}
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const optionVal = getOptionValue(option);
                  const optionLab = getOptionLabel(option);
                  const isSelected = selectedValues.includes(optionVal);
                  return (
                    <CommandItem
                      key={optionVal}
                      value={optionLab}
                      className="cursor-pointer"
                      onSelect={() => {
                        if (isSelected) {
                          removeValue(optionVal);
                        } else {
                          addValue(optionVal);
                        }
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {optionLab}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
