import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Box } from "@/components/ui/box.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { LucideGoal } from "lucide-react";

type Props = {
  title: string;
  data?: any[];
  barFill: string;
  referenceValue?: number;
  referenceUnits: string;
  xKey: string;
  yKey: string;
  isLoading?: boolean;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: any[];
  yKey: string;
  referenceUnits: string;
};

function CustomTooltip({
  active,
  payload,
  yKey,
  referenceUnits,
}: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const originalValue = payload[0].payload[yKey];
    const excessValue = payload[1]?.value || 0;

    return (
      <div className="rounded-lg border bg-white p-2 text-sm shadow-md">
        <p className="mb-1">
          {originalValue} {referenceUnits}
        </p>
        {excessValue > 0 && (
          <p className="text-red-500">
            +{excessValue} {referenceUnits}
          </p>
        )}
      </div>
    );
  }
  return null;
}

export function DailyTrendChart({
  title,
  data,
  barFill,
  referenceValue,
  referenceUnits,
  xKey,
  yKey,
  isLoading,
}: Props) {
  const transformedData = data?.map((item) => ({
    ...item,
    normalValue: Math.min(item[yKey], referenceValue || Infinity),
    excessValue:
      item[yKey] > (referenceValue || Infinity)
        ? item[yKey] - referenceValue!
        : 0,
  }));

  return (
    <Box className="mx-4 mb-4 p-4 sm:mx-0 sm:p-6">
      <div className="items-baseine mb-2 flex justify-between">
        <span className="">{title}</span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <LucideGoal className="size-4" /> {referenceValue} {referenceUnits} /
          day
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="h-[114px]" />
      ) : (
        <ResponsiveContainer width="100%" height={130}>
          <BarChart
            data={transformedData}
            margin={{
              top: 15,
              bottom: 5,
            }}
            barSize={18}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <Tooltip
              content={(props) => (
                <CustomTooltip
                  {...props}
                  yKey={yKey}
                  referenceUnits={referenceUnits}
                />
              )}
            />
            <Bar dataKey="normalValue" stackId="stack" fill={barFill} />
            <Bar
              dataKey="excessValue"
              stackId="stack"
              fill="#e11d48"
              label={{
                fontSize: 9,
                fill: "hsl(0, 0%, 14%)",
                position: "top",
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
