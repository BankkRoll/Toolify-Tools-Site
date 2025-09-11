# Toolify - Ultimate Developer Toolkit

![GitHub stars](https://img.shields.io/github/stars/BankkRoll/Toolify-Tools-Site?style=social)
![GitHub forks](https://img.shields.io/github/forks/BankkRoll/Toolify-Tools-Site?style=social)
![GitHub issues](https://img.shields.io/github/issues/BankkRoll/Toolify-Tools-Site)
![GitHub pull requests](https://img.shields.io/github/issues-pr/BankkRoll/Toolify-Tools-Site)
![GitHub contributors](https://img.shields.io/github/contributors/BankkRoll/Toolify-Tools-Site)
![GitHub last commit](https://img.shields.io/github/last-commit/BankkRoll/Toolify-Tools-Site)
![GitHub repo size](https://img.shields.io/github/repo-size/BankkRoll/Toolify-Tools-Site)

**144+ Tools • 100% Browser-Based**

A comprehensive browser-based developer toolkit providing professional tools for
developers, designers, and content creators. No downloads, no installations -
just powerful tools that work instantly in your browser.

[Live Demo](https://toolify-tools-site.vercel.app/) • [Documentation](https://toolify-tools-site.vercel.app//docs) •
[Report Bug](https://github.com/BankkRoll/Toolify-Tools-Site/issues) •
[Request Feature](https://github.com/BankkRoll/Toolify-Tools-Site/issues)

## Core Capabilities

- **144+ Professional Tools** across 9 comprehensive categories
- **100% Browser-Based** - No server processing required
- **Real-time Processing** - Instant results with live preview
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Dark Mode Support** - Built-in theme switching with system preference
  detection
- **Advanced Search & Filter** - Quick tool discovery with intelligent
  categorization
- **One-Click Copy** - Instant clipboard integration
- **Local Storage** - Persistent user preferences and history
- **Professional UI** - Modern, accessible design system
- **Privacy-First** - All processing happens client-side

## Quick Start

### Prerequisites

- Node.js 18.0 or higher
- pnpm (recommended) or npm
- Git for version control

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/BankkRoll/Toolify-Tools-Site.git
cd Toolify-Tools-Site
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Start the development server**

```bash
pnpm dev
```

4. **Open your browser** Navigate to
   [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
pnpm build
pnpm start
```

## Architecture

### Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.11-38B2AC?logo=tailwind-css&logoColor=white)
![Motion](https://img.shields.io/badge/Motion-12.23.11-0055FF?logo=framer&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5.0.6-764ABC?logo=redux&logoColor=white)
![Lucide React](https://img.shields.io/badge/Lucide_React-0.454.0-000000?logo=lucide&logoColor=white)
![Solana Web3.js](https://img.shields.io/badge/Solana_Web3.js-1.98.2-14F46D?logo=solana&logoColor=white)

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Marketing pages
│   └── tools/              # Tool application routes
├── components/             # Reusable UI components
│   ├── ui/                 # Shadcn/ui components
│   ├── layout/             # Layout components
│   ├── tools/              # Tool-specific components
│   └── landing/            # Landing page components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and configurations
├── providers/              # Context providers
└── stores/                 # State management (Zustand)
```

## Development

### Tool Implementation Pattern

Every tool follows a consistent pattern for maintainability and user experience:

<details>
 <summary>View Tool Implementation Example</summary>

```typescript
"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { useAnimations } from "@/stores/settings-store";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { m, useInView } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export default function ToolNamePage() {
  const animationsEnabled = useAnimations();

  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const contentInView = useInView(contentRef, { once: true, amount: 0.2 });

  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const [history] = useLocalStorage<string[]>("tool-history", []);

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  const MotionDiv = animationsEnabled ? m.div : "div";
  const MotionSection = animationsEnabled ? m.section : "section";

  const processData = useCallback(async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const result = processInput(input);
      setOutput(result);

      const updatedHistory = [input, ...history.filter(item => item !== input)].slice(0, 20);
      localStorage.setItem("tool-history", JSON.stringify(updatedHistory));

      toast.success("Processing complete!");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Processing failed");
    } finally {
      setIsLoading(false);
    }
  }, [input, history]);

  return (
    <ToolLayout toolId="tool-id">
      <MotionSection
        ref={headerRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={animationsEnabled ? (headerInView ? "visible" : "hidden") : undefined}
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-6"
      >
        {/* Tool-specific UI components */}
      </MotionSection>

      <ProcessingStatus
        isProcessing={isLoading}
        isComplete={false}
        error={null}
      />

      <MotionDiv
        ref={contentRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={animationsEnabled ? (contentInView ? "visible" : "hidden") : undefined}
        className="space-y-6"
      >
        {/* Results and output */}
      </MotionDiv>

      <ActionButtons
        onCopy={() => output && navigator.clipboard.writeText(output)}
        onDownload={() => output && downloadData(output)}
        copyText={output}
        downloadData={output}
        downloadFilename="tool-output.txt"
        downloadMimeType="text/plain"
      />
    </ToolLayout>
  );
}
```

</details>

### Adding New Tools

1. **Update Configuration** - Add tool definition in `src/lib/tools-config.ts`
2. **Create Tool Page** - Add new page in
   `src/app/tools/[category]/[tool-name]/page.tsx`
3. **Implement Features** - Follow the established pattern above
4. **Test Thoroughly** - Ensure all functionality works correctly

### Development Standards

- **TypeScript** - All code must be properly typed
- **Component Structure** - Follow established patterns
- **Error Handling** - Graceful error states with user feedback
- **Performance** - Optimize for speed and efficiency
- **Accessibility** - WCAG 2.1 AA compliance
- **Responsive Design** - Mobile-first approach
- **Code Quality** - ESLint, Prettier, and TypeScript strict mode

## Contributing

We welcome contributions from the community. Please see
[CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Ways to Contribute

- Report bugs and request features
- Submit code improvements
- Improve documentation
- Add new tools

### Security Features

- Client-side processing - No sensitive data sent to servers
- HTTPS-only connections
- Regular dependency security audits

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.
