# DevTools - All-in-One Developer Toolkit

A comprehensive browser-based developer toolkit providing professional tools for developers, designers, and content creators. No downloads, no installations - just powerful tools that work instantly in your browser.

## Features

### Core Capabilities

- **144+ Professional Tools** across 8 categories
- **100% Browser-Based** - No server processing required
- **Real-time Processing** - Instant results with live preview
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Dark Mode Support** - Built-in theme switching
- **Search & Filter** - Quick tool discovery
- **Copy to Clipboard** - One-click result copying

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository

```bash
git clone https://github.com/BankkRoll/Toolify-Tools-Site.git
cd Toolify-Tools-Site
```

2. Install dependencies

```bash
pnpm install
```

3. Start the development server

```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
pnpm build
pnpm start
```

## Development

### Adding New Tools

1. **Update Configuration** - Add tool definition in `lib/config/tools-config.ts`
2. **Create Tool Page** - Add new page in `app/tools/[category]/[tool-name]/page.tsx`
3. **Follow Pattern** - Use existing tools as templates
4. **Test Functionality** - Ensure all features work correctly

### Tool Implementation Pattern

```typescript
"use client"
import { useState } from "react"
import { ToolLayout } from "@/components/tools/shared/tool-layout"
import { useToast } from "@/hooks/sonner"

export default function NewToolPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")

  const processData = () => {
    // Tool-specific logic here
    toast("Success")
  }

  return (
    <ToolLayout title="Tool Name" description="Tool description" category="Category">
      {/* Tool-specific UI components */}
    </ToolLayout>
  )
}
```

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow the established design system
- Ensure responsive design
- Maintain accessibility standards
- Use semantic HTML elements

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** - `git checkout -b feature/new-tool`
3. **Follow coding standards** - TypeScript, ESLint, Prettier
4. **Test thoroughly** - Ensure all functionality works
5. **Submit a pull request** - With clear description of changes

### Development Standards

- **TypeScript** - All code must be typed
- **Component Structure** - Follow established patterns
- **Error Handling** - Graceful error states
- **Performance** - Optimize for speed and efficiency
- **Accessibility** - WCAG compliance

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
