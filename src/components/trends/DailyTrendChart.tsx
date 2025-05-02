import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Box } from "@/components/ui/box-new";

type Props = {
  title: string;
  data?: any[];
  barFill: string;
  referenceValue?: number;
  xKey: string;
  yKey: string;
  isLoading?: boolean;
};

function DailyTrendChart({
  title,
  data,
  barFill,
  referenceValue,
  xKey,
  yKey,
  isLoading,
}: Props) {
  return (
    <Box className="mb-2 px-0 pt-2 pb-1">
      <span className="pl-4">{title}</span>

      {isLoading ? (
        <div className="skeleton-block mx-4 my-2" style={{ height: 114 }}></div>
      ) : (
        <ResponsiveContainer width="100%" height={130}>
          <BarChart
            data={data}
            margin={{
              top: 15,
              right: 15,
              left: 35,
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
              label={{ position: "left", value: referenceValue, fontSize: 9 }}
              stroke="red"
              strokeDasharray="3 3"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
}

export default DailyTrendChart;
