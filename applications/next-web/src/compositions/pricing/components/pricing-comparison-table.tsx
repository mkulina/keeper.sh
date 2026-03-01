import { Copy } from "@/components/copy"
import { Heading3 } from "@/components/heading"
import { Check, Minus } from "lucide-react"
import type { FC } from "react"

type FeatureRow = {
  name: string
  free: string | boolean
  pro: string | boolean
}

const features: FeatureRow[] = [
  { name: "Sync Interval", free: "Every 30 minutes", pro: "Every 60 seconds" },
  { name: "Number of Source Calendars", free: "0-2", pro: "∞" },
  { name: "Number of Destination Calendars", free: "0-1", pro: "∞" },
  { name: "Aggregated iCal Link", free: true, pro: true },
  { name: "Priority Support", free: false, pro: true }
]

export const PricingComparisonTable: FC = () => {
  const renderCell = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check size={16} className="text-foreground-subtle mx-auto" />
      ) : (
        <Minus size={16} className="text-foreground-subtle mx-auto" />
      )
    }
    return <Copy className="text-center text-foreground-subtle">{value}</Copy>
  }

  return (
    <div className="col-span-3 grid grid-cols-subgrid">
      <div className="col-span-3 mb-6 px-2">
        <Heading3>Features</Heading3>
      </div>
      {features.map((feature, index) => (
        <div key={index} className="col-span-3 grid grid-cols-subgrid border-b border-border">
          <Copy className="px-2 py-4">{feature.name}</Copy>
          <div className="flex justify-center py-4 tabular-nums">
            {renderCell(feature.free)}
          </div>
          <div className="flex justify-center py-4 tabular-nums">
            {renderCell(feature.pro)}
          </div>
        </div>
      ))}
    </div>
  )
}
