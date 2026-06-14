import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { DermatologyDiagnosis } from '@shared/dermatology-diagnoses';

interface DiagnosisComboboxProps {
  value: string | null; // selected diagnosis name
  icd10?: string | null;
  onSelect: (diagnosis: { name: string; code: string } | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Autocomplete over the controlled ICD-10 dermatology terminology.
export default function DiagnosisCombobox({
  value,
  icd10,
  onSelect,
  placeholder = 'Search diagnosis (ICD-10)...',
  disabled,
}: DiagnosisComboboxProps) {
  const [open, setOpen] = useState(false);

  const { data: diagnoses } = useQuery<DermatologyDiagnosis[]>({
    queryKey: ['/api/research/diagnoses'],
    staleTime: Infinity,
  });

  const selected = diagnoses?.find((d) => d.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal h-auto min-h-10 py-2"
          data-testid="diagnosis-combobox-trigger"
        >
          {value ? (
            <span className="flex items-center gap-2 text-left">
              {(icd10 || selected?.code) && (
                <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                  {icd10 || selected?.code}
                </Badge>
              )}
              <span className="truncate">{value}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            // itemValue is "name code"; match either
            return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Type diagnosis or ICD-10 code..." />
          <CommandList>
            <CommandEmpty>No diagnosis found.</CommandEmpty>
            <CommandGroup>
              {diagnoses?.map((d) => (
                <CommandItem
                  key={d.code + d.name}
                  value={`${d.name} ${d.code}`}
                  onSelect={() => {
                    if (d.name === value) {
                      onSelect(null);
                    } else {
                      onSelect({ name: d.name, code: d.code });
                    }
                    setOpen(false);
                  }}
                  data-testid={`diagnosis-option-${d.code}`}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === d.name ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Badge variant="outline" className="font-mono text-[10px] mr-2 shrink-0">
                    {d.code}
                  </Badge>
                  <span className="truncate">{d.name}</span>
                  {d.malignant && (
                    <Badge variant="destructive" className="ml-auto text-[10px] shrink-0">
                      malignant
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
