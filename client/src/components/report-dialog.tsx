import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: string;
  targetId: string;
}

const reasons = [
  "Spam or misleading",
  "Harassment or hate speech",
  "Inappropriate content",
  "Impersonation",
  "Other",
];

export function ReportDialog({ open, onOpenChange, targetType, targetId }: ReportDialogProps) {
  const { toast } = useToast();
  const [selected, setSelected] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const reason = details ? `${selected}: ${details}` : selected;
      await apiRequest("POST", "/api/reports", { targetType, targetId, reason });
      toast({ title: "Report submitted. Thank you." });
      onOpenChange(false);
      setSelected("");
      setDetails("");
    } catch {
      toast({ title: "Failed to submit report", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Report {targetType}</DialogTitle>
          <DialogDescription>Why are you reporting this {targetType}?</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {reasons.map((reason) => (
            <Button
              key={reason}
              variant={selected === reason ? "default" : "outline"}
              className="w-full justify-start text-sm"
              onClick={() => setSelected(reason)}
              data-testid={`button-reason-${reason.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {reason}
            </Button>
          ))}
        </div>
        {selected === "Other" && (
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Please describe the issue..."
            className="mt-2"
            data-testid="input-report-details"
          />
        )}
        <Button
          className="w-full mt-2"
          disabled={!selected || submitting}
          onClick={handleSubmit}
          data-testid="button-submit-report"
        >
          {submitting ? "Submitting..." : "Submit Report"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
