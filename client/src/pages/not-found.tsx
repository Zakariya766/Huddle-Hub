import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { IconFootball } from "@/components/brand/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 rounded-3xl">
        <CardContent className="pt-8 pb-8 text-center">
          <IconFootball size={48} className="text-muted-foreground/40 mx-auto mb-4" />
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
