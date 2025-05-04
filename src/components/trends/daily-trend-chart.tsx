import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
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
  return (
    <Box className="mx-4 mb-4 p-4 sm:mx-0 sm:p-6">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="">{title}</span>
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <LucideGoal className="size-4" /> {referenceValue} {referenceUnits} /
          day
        </span>
      </div>

      {isLoading ? (
        <Skeleton className="mx-4 h-[114px]" />
      ) : (
        <ResponsiveContainer width="100%" height={130}>
          <BarChart
            data={data}
            margin={{
              top: 15,
              bottom: 5,
            }}
            barSize={18}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            {/* <YAxis /> */}
            <Tooltip />
            <Bar
              dataKey={yKey}
              fill={barFill}
              label={{
                fontSize: 9,
                fill: "hsl(0, 0%, 14%)",
                position: "top",
              }}
            />
            <ReferenceLine
              y={referenceValue}
              stroke="oklch(55.1% 0.027 264.364)"
              strokeWidth={2}
              strokeDasharray="10 10"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}
