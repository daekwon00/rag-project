"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface SourceItem {
    index: number;
    source: string;
    content: string;
    similarity: number;
}

interface SourcePanelProps {
    sources: SourceItem[];
}

export function SourcePanel({ sources }: SourcePanelProps) {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-4 max-w-3xl mx-auto">
            <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Sources
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {sources.map((src) => (
                    <Card key={src.index} className="bg-muted/50 border-none shadow-none">
                        <CardHeader className="p-3 pb-2 space-y-0">
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-xs font-medium truncate" title={src.source}>
                                    {src.source}
                                </CardTitle>
                                <Badge variant="secondary" className="text-[10px] px-1 h-5">
                                    {Math.round(src.similarity * 100)}%
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <ScrollArea className="h-20 rounded bg-background p-2 border text-xs text-muted-foreground">
                                {src.content}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
