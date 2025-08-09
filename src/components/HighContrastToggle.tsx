import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Contrast } from "lucide-react";

export const HighContrastToggle = () => {
  const [hc, setHc] = useState<boolean>(() => localStorage.getItem("high-contrast") === "1");

  useEffect(() => {
    const root = document.documentElement;
    if (hc) {
      root.classList.add("high-contrast");
      localStorage.setItem("high-contrast", "1");
    } else {
      root.classList.remove("high-contrast");
      localStorage.removeItem("high-contrast");
    }
  }, [hc]);

  return (
    <Button variant="subtle" size="sm" onClick={() => setHc((v) => !v)} aria-pressed={hc} aria-label="Høy kontrast">
      <Contrast /> Høy kontrast
    </Button>
  );
};
