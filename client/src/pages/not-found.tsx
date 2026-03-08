import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-8 pb-8 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="font-display text-xl text-ink mb-2" data-testid="text-404">Page Not Found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The page you're looking for doesn't exist.
          </p>
          <Link href="/">
            <Button data-testid="button-go-home">Back to Feed</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
