import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AlertCard } from "@/components/ui/alert-card";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Trash2, Eye, Calendar } from "lucide-react";
import { Observation } from "../../../db/schema";

export default function Sightings() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<Observation | null>(null);
  const { data: observations, error } = useSWR<Observation[]>("/api/observations");

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
        description: "Image deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="container py-10">
        <AlertCard
          variant="destructive"
          title="Error Loading Images"
          description="Failed to load the image gallery. Please try again later."
        />
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

  const imagesWithObservations = observations.filter(obs => obs.image_url);

  return (
    <div className="container py-10">
      <Card className="bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            Penguin Sightings Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          {imagesWithObservations.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No images uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {imagesWithObservations.map((observation) => (
                <Card key={observation.id} className="group relative overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative aspect-square">
                      <img
                        src={observation.image_url}
                        alt={`Penguin observation at ${observation.location}`}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-penguin.svg';
                          e.currentTarget.alt = 'Image unavailable';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={() => setSelectedImage(observation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(observation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          {new Date(observation.created_at).toLocaleDateString()}
                        </div>
                        <div className="font-medium">{observation.location}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video">
                <img
                  src={selectedImage.image_url}
                  alt={`Penguin observation at ${selectedImage.location}`}
                  className="object-contain w-full h-full"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{selectedImage.location}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Adults: {selectedImage.adult_count}</span>
                  <span>Chicks: {selectedImage.chick_count}</span>
                  <span>Date: {new Date(selectedImage.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm">{selectedImage.notes}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
