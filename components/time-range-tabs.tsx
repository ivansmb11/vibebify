"use client";

import { TabList, Tab, Tabs, TabPanel } from "react-aria-components";
import type { Key } from "react-aria-components";

interface TimeRangeTabsProps {
  selectedRange: string;
  onSelectionChange: (range: string) => void;
  children: React.ReactNode;
}

const ranges = [
  { id: "short_term", label: "4 weeks" },
  { id: "medium_term", label: "6 months" },
  { id: "long_term", label: "all time" },
];

export function TimeRangeTabs({
  selectedRange,
  onSelectionChange,
  children,
}: TimeRangeTabsProps) {
  return (
    <Tabs
      selectedKey={selectedRange}
      onSelectionChange={(key: Key) => onSelectionChange(key as string)}
    >
      <TabList className="flex gap-1 mb-4 bg-muted p-1 w-fit">
        {ranges.map((range) => (
          <Tab
            key={range.id}
            id={range.id}
            className={({ isSelected }) =>
              `px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all
              ${
                isSelected
                  ? "bg-punk-pink text-white -skew-x-3"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {range.label}
          </Tab>
        ))}
      </TabList>
      {ranges.map((range) => (
        <TabPanel key={range.id} id={range.id}>
          {selectedRange === range.id ? children : null}
        </TabPanel>
      ))}
    </Tabs>
  );
}
