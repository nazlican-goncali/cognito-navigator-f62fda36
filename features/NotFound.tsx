@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* PRD: Soft Cream #FFFDF5 → hsl(45, 100%, 98%) */
    --background: 45 100% 98%;
    /* PRD: Dark grey #333333 → hsl(0, 0%, 20%) */
    --foreground: 0 0% 20%;

    --card: 45 60% 99%;
    --card-foreground: 0 0% 20%;

    --popover: 45 60% 99%;
    --popover-foreground: 0 0% 20%;

    --primary: 174 45% 46%;
    --primary-foreground: 0 0% 100%;

    --secondary: 39 35% 92%;
    --secondary-foreground: 0 0% 25%;

    --muted: 39 20% 94%;
    --muted-foreground: 0 0% 45%;

    --accent: 210 35% 93%;
    --accent-foreground: 210 30% 25%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 39 20% 90%;
    --input: 39 20% 90%;
    --ring: 174 45% 46%;

    --radius: 0.75rem;

    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;

    --shadow-soft: 0 2px 20px -4px hsl(0 0% 20% / 0.06);
    --shadow-card: 0 8px 32px -8px hsl(0 0% 20% / 0.07);
    --shadow-glow: 0 0 24px -4px hsl(174 45% 46% / 0.2);
  }

  .dark {
    --background: 220 20% 8%;
    --foreground: 39 18% 93%;
    --card: 220 20% 11%;
    --card-foreground: 39 18% 93%;
    --popover: 220 20% 11%;
    --popover-foreground: 39 18% 93%;
    --primary: 174 45% 46%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 15% 18%;
    --secondary-foreground: 39 18% 90%;
    --muted: 220 15% 16%;
    --muted-foreground: 220 8% 58%;
    --accent: 210 20% 20%;
    --accent-foreground: 210 40% 85%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 220 15% 18%;
    --input: 220 15% 18%;
    --ring: 174 45% 46%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'Inter', sans-serif;
  }
}

@layer utilities {
  .shadow-soft {
    box-shadow: var(--shadow-soft);
  }
  .shadow-card {
    box-shadow: var(--shadow-card);
  }
  .shadow-glow {
    box-shadow: var(--shadow-glow);
  }
}
