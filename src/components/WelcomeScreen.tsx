import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import mascot from "@/assets/neurostudy-mascot.png";
import { ArrowRight, Sparkles, BookOpen, Brain } from "lucide-react";
import { useUser, getAgeGroup, AGE_GROUP_CONFIG } from "@/context/UserContext";
import ThemeToggle from "@/components/ThemeToggle";

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [step, setStep] = useState<"intro" | "form" | "ready">("intro");
  const [ageError, setAgeError] = useState("");

  const handleStart = () => setStep("form");

  const parsedAge = parseInt(age);
  const ageGroup = !isNaN(parsedAge) ? getAgeGroup(parsedAge) : null;
  const config = ageGroup ? AGE_GROUP_CONFIG[ageGroup] : null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (isNaN(parsedAge) || parsedAge < 7 || parsedAge > 26) {
      setAgeError("Lütfen 7 ile 26 arasında bir yaş girin.");
      return;
    }
    setAgeError("");
    setUser({ name: name.trim(), age: parsedAge, ageGroup: getAgeGroup(parsedAge) });
    setStep("ready");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/40 blur-3xl translate-y-1/3 -translate-x-1/4" />

      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-2.5">
          <img src={mascot} alt="NeuroStudy" width={36} height={36} />
          <span className="text-lg font-semibold text-foreground tracking-tight">
            Neuro<span className="text-primary">Study</span>
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 pb-12">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl w-full text-center flex flex-col items-center"
            >
              <motion.img
                src={mascot}
                alt="NeuroStudy Brain Mascot"
                width={120}
                height={120}
                className="mb-8 animate-float"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 180 }}
              />

              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight mb-4">
                Daha özgürce oku,{" "}
                <span className="text-primary">NeuroStudy</span>
              </h1>

              <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
                7-26 yaş arası öğrenciler için yapay zeka destekli bilişsel okuma asistanı. 
                Senin beyninin çalışma şekline göre kişiselleştirilmiş ve erişilebilir.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {[
                  { icon: Brain, label: "Bilişsel Destek" },
                  { icon: BookOpen, label: "Adaptif Okuma" },
                  { icon: Sparkles, label: "Yapay Zeka Özelleştirmeli" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    {label}
                  </div>
                ))}
              </div>

              <Button variant="friendly" size="lg" onClick={handleStart} className="group">
                Hemen Başla
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}

          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-md w-full"
            >
              <div className="bg-card rounded-2xl shadow-card border border-border p-8 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <img src={mascot} alt="" width={40} height={40} />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Hoş Geldin! 👋
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Okuma deneyimini kişiselleştirelim
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Adın</label>
                    <Input
                      placeholder="Örn. Ali"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 rounded-xl bg-muted/40 border-border text-base placeholder:text-muted-foreground/60"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium text-foreground">
                       Yaşın <span className="text-muted-foreground font-normal">(7–26)</span>
                     </label>
                    <Input
                      type="number"
                      min={7}
                      max={26}
                      placeholder="Örn. 14"
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        setAgeError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="h-12 rounded-xl bg-muted/40 border-border text-base placeholder:text-muted-foreground/60"
                    />
                    {ageError && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-destructive text-sm"
                      >
                        {ageError}
                      </motion.p>
                    )}
                  </div>

                  {/* Age group preview */}
                  {config && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="rounded-xl bg-primary/[0.06] border border-primary/10 px-4 py-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {config.emoji} {config.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {config.description}
                      </p>
                    </motion.div>
                  )}

                  <Button
                    variant="friendly"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={!name.trim() || !age}
                    className="w-full mt-2"
                  >
                    Devam Et
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>

                 <p className="text-xs text-muted-foreground text-center mt-6">
                   Yapay zeka açıklamalarını senin seviyene uyarlamak için yaşını kullanıyoruz.
                 </p>
              </div>
            </motion.div>
          )}

          {step === "ready" && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-md w-full"
            >
              <div className="bg-card rounded-2xl shadow-card border border-border p-10 text-center">
                <motion.div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <Sparkles className="w-7 h-7 text-primary" />
                </motion.div>

                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Harika! Her şey hazır, {name}.
                </h2>
                <p className="text-muted-foreground text-sm mb-3">
                  Senin için kişiselleştirilmiş okuma deneyimin hazır.
                </p>
                {config && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium bg-secondary rounded-full px-3 py-1 mb-8 text-secondary-foreground">
                    {config.emoji} {config.label} modu etkinleştirildi
                  </div>
                )}

                <Button variant="friendly" size="lg" className="w-full" onClick={() => navigate("/reader")}>
                  Okumaya Başla
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 text-center py-5 text-xs text-muted-foreground">
        © 2026 NeuroStudy — Cognitive reading for every learner
      </footer>
    </div>
  );
};

export default WelcomeScreen;
