import { ThemeProvider as NextThemesProvider } from "next-themes";

const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
    {children}
  </NextThemesProvider>
);

export default ThemeProvider;
