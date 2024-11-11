import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { selectObservationSchema } from "../../../db/schema";
import { z } from "zod";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { EditObservation } from "@/components/EditObservation";
import { Pencil, ArrowUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type SortField = "location" | "species" | "adult_count" | "chick_count" | "created_at";
type SortOrder = "asc" | "desc";

export default function Review() {
  const { toast } = useToast();
  const { data: observations, error } = useSWR<
    z.infer<typeof selectObservationSchema>[]
  >("/api/observations");

  const [editingObservation, setEditingObservation] = useState<
    z.infer<typeof selectObservationSchema> | null
  >(null);
  
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    order: SortOrder;
  }>({
    field: "created_at",
    order: "desc"
  });

  const sortData = (data: z.infer<typeof selectObservationSchema>[]) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.order === "asc" ? comparison : -comparison;
    });
  };

  const toggleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      order: current.field === field && current.order === "asc" ? "desc" : "asc"
    }));
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/observations/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete observation");
      
      await mutate("/api/observations");
      await mutate("/api/stats");
      
      toast({
        title: "Success",
        description: "Observation deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete observation",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="container py-10">
        <p className="text-destructive">Failed to load observations</p>
      </div>
    );
  }

  if (!observations) {
    return (
      <div className="container py-10">
        <LoadingSpinner />
      </div>
    );
  }

  const sortedObservations = sortData(observations);

  return (
    <div className="container py-10">
      <Card className="bg-white/90 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-3xl font-bold text-primary">
            Observation Records
          </CardTitle>
          <Link href="/observe">
            <Button>New Observation</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => toggleSort("location")} className="cursor-pointer hover:bg-muted">
                    Location
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => toggleSort("species")} className="cursor-pointer hover:bg-muted">
                    Species
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => toggleSort("adult_count")} className="cursor-pointer hover:bg-muted">
                    Adult Penguins
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead onClick={() => toggleSort("chick_count")} className="cursor-pointer hover:bg-muted">
                    Chicks
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead onClick={() => toggleSort("created_at")} className="cursor-pointer hover:bg-muted">
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedObservations.map((observation) => (
                  <TableRow key={observation.id} className="group">
                    <TableCell>{observation.location}</TableCell>
                    <TableCell>{observation.species}</TableCell>
                    <TableCell>{observation.adult_count}</TableCell>
                    <TableCell>{observation.chick_count}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {observation.notes}
                    </TableCell>
                    <TableCell>
                      {new Date(observation.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingObservation(observation)}
                          className="hover:bg-primary/10"
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(observation.id)}
                          className="hover:bg-destructive/10"
                        >
                          <svg
                            className="h-4 w-4 text-destructive"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {editingObservation && (
        <EditObservation
          observation={editingObservation}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingObservation(null);
          }}
        />
      )}
    </div>
  );
}
