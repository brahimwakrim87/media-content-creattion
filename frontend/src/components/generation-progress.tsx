"use client";

import { useEffect, useRef } from "react";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useGenerationStatus } from "@/lib/hooks/use-generation";

interface GenerationProgressProps {
  jobId: string;
  onComplete?: (result: string) => void;
  onError?: (error: string) => void;
}

export function GenerationProgress({
  jobId,
  onComplete,
  onError,
}: GenerationProgressProps) {
  const { data: job } = useGenerationStatus(jobId);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current || !job) return;

    if (job.status === "completed" && job.result && onComplete) {
      calledRef.current = true;
      onComplete(job.result);
    } else if (job.status === "failed" && onError) {
      calledRef.current = true;
      onError(job.errorMessage ?? "Generation failed");
    }
  }, [job, onComplete, onError]);

  if (!job) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading status...</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      {job.status === "pending" && (
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Queued for processing
            </p>
            <p className="text-xs text-gray-400">
              Waiting for the worker to pick up the job...
            </p>
          </div>
        </div>
      )}

      {job.status === "processing" && (
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-700">
              Generating content...
            </p>
            <p className="text-xs text-blue-400">
              {job.provider === "anthropic_claude"
                ? "AI is writing your content"
                : "Processing media in N8N"}
            </p>
          </div>
        </div>
      )}

      {job.status === "completed" && (
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-sm font-medium text-green-700">
              Generation complete
            </p>
            <div className="flex gap-3 text-xs text-green-500">
              {job.tokensUsed && <span>{job.tokensUsed} tokens used</span>}
              {job.processingTimeMs && (
                <span>{(job.processingTimeMs / 1000).toFixed(1)}s</span>
              )}
            </div>
          </div>
        </div>
      )}

      {job.status === "failed" && (
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-700">
              Generation failed
            </p>
            {job.errorMessage && (
              <p className="text-xs text-red-500">{job.errorMessage}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
