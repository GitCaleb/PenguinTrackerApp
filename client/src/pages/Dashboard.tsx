import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCard } from "@/components/ui/alert-card";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LocationMetrics } from "@/components/LocationMetrics";
import { Users, Baby, MapPin } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Stats {
  total_adults: number;
  total_chicks: number;
  location_count: number;
  random_image: string | null;
}

const penguinSpecies = [
  {
    name: "Emperor",
    height: "100-130 cm",
    weight: "22-45 kg",
    diet: "Fish, squid, and krill",
    habitat: "Antarctic coastal regions",
    characteristics: "Largest penguin species, distinctive yellow-gold neck patches"
  },
  {
    name: "King",
    height: "70-100 cm",
    weight: "11-16 kg",
    diet: "Small fish and squid",
    habitat: "Sub-Antarctic islands",
    characteristics: "Second largest penguin, similar to Emperor but with brighter colors"
  },
  {
    name: "Adelie",
    height: "46-75 cm",
    weight: "3.6-6.0 kg",
    diet: "Mainly krill and small fish",
    habitat: "Antarctic coast and islands",
    characteristics: "Black and white plumage with white ring around eyes"
  },
  {
    name: "Chinstrap",
    height: "68-76 cm",
    weight: "3.2-5.3 kg",
    diet: "Krill and small fish",
    habitat: "Antarctic Peninsula and islands",
    characteristics: "Distinctive black line under chin, giving them their name"
  },
  {
    name: "Gentoo",
    height: "75-90 cm",
    weight: "4.5-8.5 kg",
    diet: "Krill, squid, and fish",
    habitat: "Antarctic Peninsula and sub-Antarctic islands",
    characteristics: "White stripe across head, bright orange-red bill"
  },
  {
    name: "Macaroni",
    height: "70-75 cm",
    weight: "4.5-5.5 kg",
    diet: "Krill, small fish, and squid",
    habitat: "Sub-Antarctic and Antarctic Peninsula",
    characteristics: "Yellow crest feathers, distinctive orange plumes"
  },
  {
    name: "Royal",
    height: "65-75 cm",
    weight: "4.3-5.4 kg",
    diet: "Krill, small fish, and squid",
    habitat: "Sub-Antarctic islands",
    characteristics: "Yellow crest feathers, similar to Macaroni but with longer plumes"
  }
];

export default function Dashboard() {
  const { data: stats, error: statsError } = useSWR<Stats>("/api/stats");

  if (statsError) {
    return (
      <div className="container py-10">
        <AlertCard
          variant="destructive"
          title="Error Loading Dashboard"
          description="Failed to load dashboard data. Please try again later."
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container py-10">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Adult Penguins</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_adults}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Penguin Chicks</CardTitle>
            <Baby className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_chicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.location_count}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="md:col-span-3">
          <LocationMetrics 
            setPosition={() => {}} 
            setSelectedLocation={() => {}} 
          />
        </div>
        {stats?.random_image && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Latest Sighting</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img
                  src={stats.random_image}
                  alt="Latest penguin sighting"
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-penguin.svg';
                    e.currentTarget.alt = 'Image unavailable';
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Penguin Species Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Species</TableHead>
                  <TableHead>Height</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead className="hidden md:table-cell">Diet</TableHead>
                  <TableHead className="hidden lg:table-cell">Habitat</TableHead>
                  <TableHead className="hidden xl:table-cell">Characteristics</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penguinSpecies.map((species) => (
                  <TableRow key={species.name}>
                    <TableCell className="font-medium">{species.name}</TableCell>
                    <TableCell>{species.height}</TableCell>
                    <TableCell>{species.weight}</TableCell>
                    <TableCell className="hidden md:table-cell">{species.diet}</TableCell>
                    <TableCell className="hidden lg:table-cell">{species.habitat}</TableCell>
                    <TableCell className="hidden xl:table-cell">{species.characteristics}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
