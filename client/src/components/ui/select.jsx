"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";

const Select = SelectPrimitive.Root;

const SelectTrigger = React.forwardRef(
  ({ className = "", children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={`group flex h-10 w-full items-center justify-between rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      {...props}
    >
      {/* Left side (text) */}
      <span className="flex items-center gap-2">
        {children}
      </span>

      {/* Right side icon */}
      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </SelectPrimitive.Trigger>
  )
);

const SelectValue = SelectPrimitive.Value;

const SelectContent = React.forwardRef(
  ({ className = "", children, ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-700 bg-gray-900 text-white shadow-md ${className}`}
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
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-indigo-500 ${className}`}
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