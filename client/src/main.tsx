import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";
import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/toaster";
import { fetcher } from "./lib/fetcher";
import Home from "./pages/Home";
import Review from "./pages/Review";
import Dashboard from "./pages/Dashboard";
import Sightings from "./pages/Sightings";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Navigation } from "@/components/Navigation";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <SWRConfig 
        value={{ 
          fetcher,
          onError: (error) => {
            console.error('SWR Error:', error);
          },
          shouldRetryOnError: false
        }}
      >
        <div className="min-h-screen bg-gradient-to-b from-secondary to-background">
          <Navigation />
          <main className="pb-16">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/observe" component={Home} />
              <Route path="/review" component={Review} />
              <Route path="/sightings" component={Sightings} />
              <Route>
                <div className="container py-10 text-center">
                  <h1 className="text-4xl font-bold text-primary">404</h1>
                  <p className="mt-4 text-lg text-muted-foreground">Page Not Found</p>
                </div>
              </Route>
            </Switch>
          </main>
          <footer className="fixed bottom-0 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
            <div className="container flex h-14 items-center justify-center text-sm text-muted-foreground">
              Sponsored by{" "}
              <a
                href="https://engearment.com/writers/michael-cooper/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary hover:underline"
              >
                Engearment
              </a>
            </div>
          </footer>
        </div>
        <Toaster />
      </SWRConfig>
    </ErrorBoundary>
  </StrictMode>
);
