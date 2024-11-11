import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertObservationSchema } from "../../../db/schema";

const locations = [
  "Antarctic Peninsula",
  "South Shetland Islands", 
  "Port Lockroy",
  "Deception Island",
  "Half Moon Island",
  "Paradise Harbor",
  "Neko Harbor",
  "Petermann Island",
  "Lemaire Channel",
  "South Georgia Island",
  "Elephant Island",
  "Paulet Island",
  "Brown Bluff",
  "Cuverville Island",
  "Booth Island",
  "Torgersen Island"
];

const species = [
  "Emperor",
  "King",
  "Adelie",
  "Chinstrap",
  "Gentoo",
  "Macaroni",
  "Royal",
];

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof insertObservationSchema>>({
    resolver: zodResolver(insertObservationSchema),
    defaultValues: {
      location: "",
      species: "",
      adult_count: 0,
      chick_count: 0,
      notes: "",
    },
  });

  async function onSubmit(data: z.infer<typeof insertObservationSchema>) {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });
      
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const response = await fetch("/api/observations", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Failed to submit");
      
      toast({
        title: "Success!",
        description: "Observation recorded successfully",
      });
      form.reset();
      setSelectedFile(null);
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit observation",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <Card className="bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            Penguin Observation Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Species</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select species" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {species.map((species) => (
                          <SelectItem key={species} value={species}>
                            {species}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adult_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adult Penguins</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="chick_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penguin Chicks</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter observation notes..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Photo</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  Submit Observation
                </Button>
                <Link href="/review">
                  <Button variant="secondary" type="button">
                    Review Data
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}