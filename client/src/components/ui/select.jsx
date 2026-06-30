"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";

const Select = SelectPrimitive.Root;

const SelectTrigger = React.forwardRef(
  ({ className = "", children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={`group flex h-10 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-input focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary/50 transition-all ${className}`}
      {...props}
    >
      <span className="flex items-center gap-2">
        {children}
      </span>
      <ChevronDown className="h-4 w-4 text-muted shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </SelectPrimitive.Trigger>
  )
);

const SelectValue = SelectPrimitive.Value;

const SelectContent = React.forwardRef(
  ({ className = "", children, ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={`relative z-50 min-w-[8rem] overflow-hidden rounded-lg dropdown-panel text-foreground ${className}`}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
);

const SelectItem = React.forwardRef(
  ({ className = "", children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors data-[highlighted]:bg-hover data-[highlighted]:text-foreground data-[state=checked]:bg-primary/15 data-[state=checked]:text-primary ${className}`}
      {...props}
    >
      <SelectPrimitive.ItemText>
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
);

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
};
