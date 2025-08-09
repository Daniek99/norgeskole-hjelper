import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export interface TaskModel { id: string; type: string; level: number; data: any; answer: any; }

interface Props { task: TaskModel; onSubmit: (score: number, response: any) => void; }

export const InteractiveTaskRenderer = ({ task, onSubmit }: Props) => {
  if (task.type === "mcq") return <MCQ task={task} onSubmit={onSubmit} />;
  return (
    <Card className="mt-4">
      <CardHeader><CardTitle>Oppgave ({task.type})</CardTitle></CardHeader>
      <CardContent>
        <p>Kommer snart.</p>
      </CardContent>
    </Card>
  );
};

const MCQ = ({ task, onSubmit }: Props) => {
  const [selected, setSelected] = useState<number | null>(null);
  const options: string[] = task.data?.options ?? [];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{task.data?.question ?? "Velg riktig svar"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2">
          {options.map((opt, idx) => (
            <Button key={idx} variant={selected === idx ? "hero" : "secondary"} onClick={() => setSelected(idx)}>
              {opt}
            </Button>
          ))}
        </div>
        <Button
          variant="default"
          onClick={() => {
            if (selected === null) return toast({ title: "Velg et alternativ" });
            const correctIndex = task.answer?.index ?? 0;
            const score = selected === correctIndex ? 1 : 0;
            onSubmit(score, { selected, correctIndex });
          }}
        >
          Send svar
        </Button>
      </CardContent>
    </Card>
  );
};
