import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export interface TaskModel { id: string; type: string; level: number; data: any; answer: any; }

interface Props { task: TaskModel; onSubmit: (score: number, response: any) => void; }

export const InteractiveTaskRenderer = ({ task, onSubmit }: Props) => {
  if (task.type === "mcq") return <MCQ task={task} onSubmit={onSubmit} />;
  if (task.type === "fill_blank") return <FillBlank task={task} onSubmit={onSubmit} />;
  if (task.type === "sentence_complete") return <SentenceComplete task={task} onSubmit={onSubmit} />;
  if (task.type === "word_association") return <WordAssociation task={task} onSubmit={onSubmit} />;
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
            <Button key={idx} variant={selected === idx ? "default" : "secondary"} onClick={() => setSelected(idx)}>
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

const FillBlank = ({ task, onSubmit }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const options: string[] = task.data?.options ?? [];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Fyll inn det manglende ordet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-lg">{task.data?.sentence?.replace('_____', '_____')}</p>
        <div className="grid gap-2">
          {options.map((opt, idx) => (
            <Button key={idx} variant={selected === opt ? "default" : "secondary"} onClick={() => setSelected(opt)}>
              {opt}
            </Button>
          ))}
        </div>
        <Button
          variant="default"
          onClick={() => {
            if (!selected) return toast({ title: "Velg et ord" });
            const score = selected === task.answer?.correct ? 1 : 0;
            onSubmit(score, { selected, correct: task.answer?.correct });
          }}
        >
          Send svar
        </Button>
      </CardContent>
    </Card>
  );
};

const SentenceComplete = ({ task, onSubmit }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const options: string[] = task.data?.options ?? [];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{task.data?.question ?? "Fullfør setningen"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2">
          {options.map((opt, idx) => (
            <Button key={idx} variant={selected === opt ? "default" : "secondary"} onClick={() => setSelected(opt)}>
              {opt}
            </Button>
          ))}
        </div>
        <Button
          variant="default"
          onClick={() => {
            if (!selected) return toast({ title: "Velg et alternativ" });
            const score = selected === task.answer?.correct ? 1 : 0;
            onSubmit(score, { selected, correct: task.answer?.correct });
          }}
        >
          Send svar
        </Button>
      </CardContent>
    </Card>
  );
};

const WordAssociation = ({ task, onSubmit }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  const options: string[] = task.data?.options ?? [];

  const toggleSelection = (option: string) => {
    setSelected(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{task.data?.question ?? "Velg ord som passer"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Velg alle ord som passer (du kan velge flere)</p>
        <div className="grid gap-2">
          {options.map((opt, idx) => (
            <Button 
              key={idx} 
              variant={selected.includes(opt) ? "default" : "secondary"} 
              onClick={() => toggleSelection(opt)}
            >
              {opt}
            </Button>
          ))}
        </div>
        <Button
          variant="default"
          onClick={() => {
            if (selected.length === 0) return toast({ title: "Velg minst ett ord" });
            const correctAnswers = task.answer?.correct ?? [];
            const score = selected.every(s => correctAnswers.includes(s)) && 
                         correctAnswers.every(c => selected.includes(c)) ? 1 : 0;
            onSubmit(score, { selected, correct: correctAnswers });
          }}
        >
          Send svar
        </Button>
      </CardContent>
    </Card>
  );
};
