import { useState, useRef, useEffect } from "react";
import rehypeRaw from "rehype-raw";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import mascot from "@/assets/neurostudy-mascot.png";
import { Focus, ArrowLeft, BookOpen, User, Loader2, Sparkles, ChevronRight, Upload, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUser, AGE_GROUP_CONFIG } from "@/context/UserContext";
import { useLearningMode, LEARNING_MODES, type LearningMode } from "@/context/LearningModeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface KeyTerm {
  term: string;
  definition: string;
}

interface TextChunk {
  id?: number;
  sectionLabel?: string;
  title: string;
  content: string;
  analogy?: string | null;
  keyTerms?: KeyTerm[];
}

interface Quiz {
  question: string;
  options: string[];
  correctIndex: number;
}

interface SimplifiedResult {
  summary: string;
  summaryTerms?: KeyTerm[];
  chunks: TextChunk[];
  quiz?: Quiz | null;
}

/** Sanitize AI text: replace leaked Markdown ** with HTML <b> tags */
const sanitizeText = (text: string): string => {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
};

/** Inline tooltip for key terms */
const TermTooltip = ({ term, definition }: { term: string; definition: string }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  /* Position tooltip in fixed coordinates, clamped to viewport */
  useEffect(() => {
    if (!open || !tooltipRef.current || !triggerRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const tip = tooltipRef.current;
    const pad = 16;

    // Place above the trigger, centered
    let left = trigger.left + trigger.width / 2 - tip.offsetWidth / 2;
    let top = trigger.top - tip.offsetHeight - 8;

    // Clamp horizontally
    if (left < pad) left = pad;
    if (left + tip.offsetWidth > window.innerWidth - pad)
      left = window.innerWidth - pad - tip.offsetWidth;

    // If no room above, place below
    if (top < pad) top = trigger.bottom + 8;

    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }, [open]);

  return (
    <span ref={ref} className="relative inline">
      <span
        ref={triggerRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="text-primary underline decoration-primary/40 decoration-dotted underline-offset-2 cursor-pointer font-semibold hover:decoration-primary transition-colors"
      >
        {term}
      </span>
      {open && (
        <span
          ref={tooltipRef}
          style={{ position: "fixed", zIndex: 100, maxWidth: "max(30vw, 300px)" }}
          className="rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        >
          <span className="font-semibold text-primary block" style={{ overflowWrap: "break-word", textWrap: "balance" }}>{term}:</span>
          <span style={{ overflowWrap: "break-word", textWrap: "balance" }}>{definition}</span>
        </span>
      )}
    </span>
  );
};

/** Safe HTML renderer with sanitization */
const SafeHtml = ({ html, className }: { html: string; className?: string }) => (
  <div
    className={cn("[&_b]:font-bold [&_b]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-[15px] [&_p]:mb-3", className)}
    dangerouslySetInnerHTML={{ __html: sanitizeText(html) }}
  />
);

const ReadingPanel = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { mode, setMode } = useLearningMode();
  const [rawText, setRawText] = useState("");
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SimplifiedResult | null>(null);
  const [activeChunk, setActiveChunk] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = user ? AGE_GROUP_CONFIG[user.ageGroup] : null;

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Hata", description: "Lütfen bir PDF dosyası seçin.", variant: "destructive" });
      return;
    }
    setIsExtractingPdf(true);
    setPdfFileName(file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(" ") + "\n\n";
      }
      if (!text.trim()) {
        toast({ title: "Uyarı", description: "PDF'den metin çıkarılamadı.", variant: "destructive" });
        setPdfFileName(null);
      } else {
        setPdfContent(text.trim());
        toast({ title: "Başarılı ✅", description: `"${file.name}" başarıyla yüklendi ve işlenmeye hazır.` });
      }
    } catch (err: any) {
      console.error("PDF extraction error:", err);
      toast({ title: "PDF Hatası", description: "PDF okunamadı.", variant: "destructive" });
    } finally {
      setIsExtractingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const effectiveText = pdfContent || rawText;

  const handleFocus = async () => {
    if (!effectiveText.trim() || !user) return;
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("simplify-text", {
        body: { text: effectiveText, age: user.age, ageGroup: user.ageGroup, learningMode: mode },
      });

      if (error) throw new Error(error.message || "AI processing failed");
      if (data?.error) throw new Error(data.error);

      let parsed: SimplifiedResult;
      if (typeof data === 'string') {
        try {
          const jsonMatch = data.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, data];
          parsed = JSON.parse(jsonMatch[1]!.trim());
        } catch {
          parsed = { summary: data.slice(0, 500), chunks: [{ title: "Metin", content: data }], quiz: null };
        }
      } else {
        parsed = data as SimplifiedResult;
      }
      setResult(parsed);
      setIsFocused(true);
      setActiveChunk(0);
      setQuizAnswer(null);
      setQuizRevealed(false);
    } catch (err: any) {
      console.error("Simplification error:", err);
      toast({ title: "AI Hatası", description: err.message || "Metin işlenemedi.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBack = () => {
    setIsFocused(false);
    setActiveChunk(0);
    setQuizAnswer(null);
    setQuizRevealed(false);
  };

  const handleNextChunk = () => {
    if (result && activeChunk < result.chunks.length - 1) {
      setActiveChunk((prev) => prev + 1);
    }
  };

  const handlePrevChunk = () => {
    if (activeChunk > 0) setActiveChunk((prev) => prev - 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <img src={mascot} alt="NeuroStudy" width={80} height={80} className="mb-4 opacity-60" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Önce hoş geldin!</h2>
        <p className="text-muted-foreground text-sm mb-6">Başlamak için adınızı ve yaşınızı söyleyin.</p>
        <Button variant="friendly" size="lg" onClick={() => navigate("/")}>
          Hoş Geldin Ekranına Git
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/30 blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <img src={mascot} alt="NeuroStudy" width={32} height={32} />
          <span className="text-lg font-semibold text-foreground tracking-tight">
            Neuro<span className="text-primary">Study</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm bg-secondary/60 rounded-full px-3 py-1.5">
            <User className="w-3.5 h-3.5 text-primary" />
            <span className="text-secondary-foreground font-medium">{user.name}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{config?.emoji} {user.age}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Ana Sayfa
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex flex-col px-4 md:px-8 py-6 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isFocused ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="max-w-3xl w-full mx-auto flex flex-col flex-1"
            >
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-foreground mb-1 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Okuma Stüdyosu
                </h2>
                <p className="text-muted-foreground text-sm">
                  Anlamakta zorlandığın ders notunu veya makaleyi yapıştır, AI sana uygun hale getirsin.
                </p>
                {config && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-primary/[0.06] border border-primary/10 rounded-full px-3 py-1 mt-2 text-foreground">
                    {config.emoji} {config.label}
                  </div>
                )}
              </div>

              {/* Learning Needs Selector — 3 modes */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-foreground mb-2">Öğrenme İhtiyacı</h3>
                <div className="grid grid-cols-3 gap-2">
                  {LEARNING_MODES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={cn(
                        "text-left rounded-xl border px-4 py-3 transition-all text-sm",
                        mode === m.id
                          ? "border-primary bg-primary/[0.06] ring-1 ring-primary/20"
                          : "border-border bg-card hover:bg-accent/50"
                      )}
                    >
                      <span className="font-medium text-foreground">
                        {m.emoji} {m.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {m.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {pdfContent && pdfFileName ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.04] p-5 min-h-[120px]"
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{pdfFileName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">yüklendi ve işlenmeye hazır.</p>
                  </div>
                  <button
                    onClick={() => { setPdfContent(null); setPdfFileName(null); }}
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label="Dosyayı kaldır"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </motion.div>
              ) : (
                <>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Metninizi buraya yapıştırın... (ders notları, ders kitabı paragrafları, makaleler)"
                    className="flex-1 min-h-[280px] w-full rounded-xl border border-border bg-card p-5 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all shadow-soft"
                    autoFocus
                  />

                  {/* PDF Upload */}
                  <div className="flex items-center gap-3 mt-3">
                    <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isExtractingPdf} className="text-muted-foreground">
                      {isExtractingPdf ? (<><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />PDF Okunuyor...</>) : (<><Upload className="w-4 h-4 mr-1.5" />PDF Yükle</>)}
                    </Button>
                  </div>
                </>
              )}

              <Button variant="friendly" size="lg" onClick={handleFocus} disabled={!effectiveText.trim() || isAnalyzing} className="mt-5 self-center px-12">
                {isAnalyzing ? (<><Loader2 className="w-5 h-5 mr-1 animate-spin" />AI Analiz Ediyor...</>) : (<><Focus className="w-5 h-5 mr-1" />Odaklan</>)}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="split"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="sm" onClick={handleBack} className="text-muted-foreground">
                  <ArrowLeft className="w-4 h-4 mr-1" />Metni Düzenle
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full">
                    {config?.emoji} {config?.label}
                  </span>
                  <span className="text-xs text-primary bg-primary/[0.06] px-3 py-1 rounded-full font-medium">
                    {LEARNING_MODES.find(m => m.id === mode)?.emoji} {LEARNING_MODES.find(m => m.id === mode)?.label}
                  </span>
                </div>
              </div>

              {/* AI Output */}
              <div className="flex-1 min-h-0">
                <div className="h-full flex flex-col rounded-xl border-2 border-primary/20 bg-card shadow-soft overflow-hidden">
                  <div className="px-5 py-3 border-b border-primary/10 bg-primary/[0.04]">
                    <h3 className="text-sm font-medium text-primary flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />AI-Optimize Edilmiş Metin
                    </h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {result ? (
                      <>
                        {/* Summary */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-primary/[0.05] border border-primary/10 p-5">
                          <h4 className="text-sm font-semibold text-primary flex items-center gap-1.5 mb-2">
                            <Focus className="w-4 h-4" />Özet
                          </h4>
                          <SafeHtml html={result.summary} className="text-[15px] leading-relaxed text-foreground" />
                          {result.summaryTerms && result.summaryTerms.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {result.summaryTerms.map((kt, i) => (
                                <TermTooltip key={i} term={kt.term} definition={kt.definition} />
                              ))}
                            </div>
                          )}
                        </motion.div>

                        {/* Chunks */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                              <ChevronRight className="w-4 h-4 text-primary" />Basitleştirilmiş Parçalar
                            </h4>
                            <span className="text-xs text-muted-foreground">
                              İlerleme: {activeChunk + 1} / {result.chunks.length} bölüm
                            </span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted mb-4">
                            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${((activeChunk + 1) / result.chunks.length) * 100}%` }} />
                          </div>

                          {(() => {
                            const chunk = result.chunks[activeChunk];
                            if (!chunk) return null;
                            return (
                              <motion.div
                                key={activeChunk}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className={cn(
                                  "rounded-xl border border-border bg-background",
                                  mode === "visual" ? "p-7 space-y-4" : "p-5"
                                )}
                              >
                                {chunk.sectionLabel && (
                                  <span className="inline-block text-[11px] font-medium tracking-wide uppercase text-primary/70 bg-primary/5 px-2 py-0.5 rounded mb-2">
                                    {chunk.sectionLabel}
                                  </span>
                                )}
                                <h5 className={cn(
                                  "font-semibold text-foreground mb-2 flex items-center gap-2",
                                  mode === "visual" ? "text-base" : "text-sm"
                                )}>
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                    {activeChunk + 1}
                                  </span>
                                  {chunk.title}
                                </h5>

                                {/* Content — mode-adaptive styling */}
                                <SafeHtml
                                  html={chunk.content}
                                  className={cn(
                                    "text-foreground/90 mb-3",
                                    mode === "visual" && "text-base leading-[2.2] tracking-wide",
                                    mode === "fast" && "text-[15px] leading-[1.8]",
                                    mode === "deep" && "text-[15px] leading-[1.9]",
                                  )}
                                />

                                {/* Key terms */}
                                {chunk.keyTerms && chunk.keyTerms.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {chunk.keyTerms.map((kt, i) => (
                                      <TermTooltip key={i} term={kt.term} definition={kt.definition} />
                                    ))}
                                  </div>
                                )}

                                {/* Analogy — skip in fast mode */}
                                {chunk.analogy && mode !== "fast" && (
                                  <div className={cn(
                                    "rounded-lg bg-secondary/50 border border-secondary px-4 py-3 mt-2",
                                    mode === "visual" && "text-base"
                                  )}>
                                    <p className="text-sm text-secondary-foreground">
                                      💡 <span className="font-medium">Bunu şöyle düşün:</span> {chunk.analogy}
                                    </p>
                                  </div>
                                )}

                                {/* Navigation */}
                                <div className="flex items-center justify-between mt-4">
                                  <Button variant="ghost" size="sm" onClick={handlePrevChunk} disabled={activeChunk === 0} className="text-muted-foreground">
                                    <ArrowLeft className="w-4 h-4 mr-1" />Önceki
                                  </Button>
                                  {activeChunk < result.chunks.length - 1 ? (
                                    <Button variant="friendly" size="sm" onClick={handleNextChunk}>
                                      Sonraki<ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                  ) : (
                                    <p className="text-sm text-primary font-medium">🎉 Tüm bölümler tamamlandı</p>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })()}
                        </div>

                        {/* Quiz — only for deep mode */}
                        {mode === "deep" && result.quiz && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-muted/30 p-5">
                            <h4 className="text-sm font-semibold text-foreground mb-3">🧪 Anlama Sorusu</h4>
                            <p className="text-sm text-foreground mb-3">{result.quiz.question}</p>
                            <div className="flex flex-col gap-2">
                              {result.quiz.options.map((opt, idx) => {
                                const isCorrect = idx === result.quiz!.correctIndex;
                                const isSelected = quizAnswer === idx;
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => { if (!quizRevealed) { setQuizAnswer(idx); setQuizRevealed(true); } }}
                                    disabled={quizRevealed}
                                    className={cn(
                                      "text-left text-sm px-4 py-2.5 rounded-lg border transition-all",
                                      !quizRevealed && "hover:bg-accent cursor-pointer border-border",
                                      quizRevealed && isCorrect && "border-green-500 bg-green-500/10 text-green-700",
                                      quizRevealed && isSelected && !isCorrect && "border-destructive bg-destructive/10 text-destructive",
                                      quizRevealed && !isSelected && !isCorrect && "opacity-50 border-border",
                                    )}
                                  >
                                    <span className="font-semibold mr-2">{String.fromCharCode(65 + idx)}.</span>{opt}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-muted-foreground border-t border-border/60">
        © 2026 NeuroStudy — Her öğrenci için bilişsel okuma
      </footer>
    </div>
  );
};

export default ReadingPanel;
