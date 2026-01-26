"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function Combobox({ 
  options = [], 
  value, 
  onValueChange, 
  placeholder = "Seleccionar...",
  className,
  truncate = false, 
  maxLength = 30
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.value.toLowerCase().includes(search.toLowerCase())
  )

  const truncateIfNeeded = (text) => {
    if (!truncate || !text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
            className={cn(
              "w-full min-w-0 justify-between text-left overflow-hidden",
              truncate && "truncate",
              className
            )}
        >
          <span className={cn("truncate", !truncate && "max-w-none")}>
            {value
              ? truncateIfNeeded(options.find((option) => option.value === value)?.label)
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder={`Buscar ${placeholder.toLowerCase()}...`} 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value === value ? "" : option.value)
                    setOpen(false)
                    setSearch("") 
                  }}
                  className={truncate ? "truncate" : ""}
                >
                  <span className={truncate ? "truncate" : ""}>
                    {truncateIfNeeded(option.label)}
                  </span>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 flex-shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}