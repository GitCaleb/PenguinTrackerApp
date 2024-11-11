import useSWR from "swr";
import { AlertCard } from "@/components/ui/alert-card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingDown, TrendingUp } from "lucide-react";

interface LocationMetric {
  location: string;
  total_adults: number;
  total_chicks: number;
  total_population: number;
  observation_count: number;
  latest_observation: string;
  growth_rate: number;
}

const locations: Record<string, [number, number]> = {
  "Antarctic Peninsula": [-64.2500, -62.2500],
  "South Shetland Islands": [-62.5000, -59.0000],
  "Port Lockroy": [-63.4833, -64.8167],
  "Deception Island": [-62.9500, -60.6333],
  "Half Moon Island": [-62.5947, -59.9144],
  "Paradise Harbor": [-64.8500, -62.8833],
  "Neko Harbor": [-64.8400, -62.5400],
  "Petermann Island": [-65.1667, -64.1667],
  "Lemaire Channel": [-65.0500, -63.9500],
  "South Georgia Island": [-54.2500, -36.7500],
  "Elephant Island": [-61.1000, -55.1167],
  "Paulet Island": [-63.5833, -55.7500],
  "Brown Bluff": [-63.5167, -56.9000],
  "Cuverville Island": [-64.6833, -62.6333],
  "Booth Island": [-65.0833, -64.8333],
  "Torgersen Island": [-64.7667, -64.0833]
};

interface LocationMetricsProps {
  setPosition: (position: { coordinates: [number, number]; zoom: number }) => void;
  setSelectedLocation: (location: string | null) => void;
}

export function LocationMetrics({ setPosition, setSelectedLocation }: LocationMetricsProps) {
  const { data: metrics, error, isLoading } = useSWR<LocationMetric[]>(
    "/api/location-metrics",
    { 
      revalidateOnFocus: false,
      dedupingInterval: 10000
    }
  );

  if (error) {
    return (
      <AlertCard
        variant="destructive"
        title="Error Loading Metrics"
        description="Failed to load location metrics. Please try again later."
      />
    );
  }

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Metrics</CardTitle>
          <CardDescription>Loading metrics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Metrics</CardTitle>
          <CardDescription>No observation data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Metrics</CardTitle>
        <CardDescription>
          Detailed metrics and population trends by location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Total Population</TableHead>
                <TableHead>Adults</TableHead>
                <TableHead>Chicks</TableHead>
                <TableHead>Observations</TableHead>
                <TableHead>Growth Trend</TableHead>
                <TableHead>Last Observed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((metric) => (
                <TableRow 
                  key={metric.location}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    const coords = locations[metric.location];
                    if (coords) {
                      setPosition({ coordinates: coords, zoom: 3 });
                      setSelectedLocation(metric.location);
                    }
                  }}
                >
                  <TableCell className="font-medium text-primary">
                    {metric.location}
                  </TableCell>
                  <TableCell className="font-medium">
                    {metric.total_population}
                  </TableCell>
                  <TableCell>{metric.total_adults}</TableCell>
                  <TableCell>{metric.total_chicks}</TableCell>
                  <TableCell>{metric.observation_count}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {metric.growth_rate > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : metric.growth_rate < 0 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      <span
                        className={
                          metric.growth_rate > 0
                            ? "text-green-500"
                            : metric.growth_rate < 0
                            ? "text-red-500"
                            : "text-muted-foreground"
                        }
                      >
                        {metric.growth_rate !== 0
                          ? `${Math.abs(metric.growth_rate).toFixed(1)}/obs`
                          : "Stable"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(metric.latest_observation).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}