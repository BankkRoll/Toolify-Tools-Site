# Contributing to Toolify

Thank you for your interest in contributing to Toolify! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Adding New Tools](#adding-new-tools)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)
- [Feature Requests](#feature-requests)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- pnpm (recommended) or npm
- Git for version control
- VS Code (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - ESLint
  - Prettier

### Development Setup

1. **Fork the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/Toolify-Tools-Site.git
   cd Toolify-Tools-Site
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development server**

   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Adding New Tools

### Step 1: Update Configuration

Add your tool definition in `src/lib/tools-config.ts`:

```typescript
{
  id: "your-tool-id",
  name: "Your Tool Name",
  description: "Brief description of what your tool does",
  href: "/tools/category/your-tool-name",
  icon: "IconName", // Use Lucide React icon names
  category: "category-id", // developer, web3, image, pdf, text, time, units, number, general
  status: "active", // active, inactive, beta
  tags: ["tag1", "tag2"],
  featured: false, // Set to true for featured tools
  popular: false, // Set to true for popular tools
}
```

### Step 2: Create Tool Page

Create a new file at `src/app/tools/[category]/[your-tool-name]/page.tsx`:

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

export default function YourToolPage() {
  const animationsEnabled = useAnimations();

  const headerRef = useRef(null);
  const contentRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.2 });
  const contentInView = useInView(contentRef, { once: true, amount: 0.2 });

  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const [history] = useLocalStorage<string[]>("your-tool-history", []);

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
      const result = processYourTool(input);
      setOutput(result);

      const updatedHistory = [input, ...history.filter(item => item !== input)].slice(0, 20);
      localStorage.setItem("your-tool-history", JSON.stringify(updatedHistory));

      toast.success("Processing complete!");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Processing failed");
    } finally {
      setIsLoading(false);
    }
  }, [input, history]);

  return (
    <ToolLayout toolId="your-tool-id">
      <MotionSection
        ref={headerRef}
        initial={animationsEnabled ? "hidden" : undefined}
        animate={animationsEnabled ? (headerInView ? "visible" : "hidden") : undefined}
        variants={animationsEnabled ? sectionVariants : undefined}
        className="space-y-6"
      >
        {/* Your tool's input UI */}
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
        {/* Your tool's output UI */}
      </MotionDiv>

      <ActionButtons
        onCopy={() => output && navigator.clipboard.writeText(output)}
        onDownload={() => output && downloadData(output)}
        copyText={output}
        downloadData={output}
        downloadFilename="your-tool-output.txt"
        downloadMimeType="text/plain"
      />
    </ToolLayout>
  );
}
```

### Step 3: Implement Core Features

Every tool should include:

- Animations - Use `useAnimations()` and motion components
- Local Storage - Use `useLocalStorage()` for persistence
- Error Handling - Proper try-catch blocks with user feedback
- Loading States - Use `ProcessingStatus` component
- Action Buttons - Use `ActionButtons` for copy/download
- Responsive Design - Mobile-first approach
- Accessibility - Proper ARIA labels and keyboard navigation
- TypeScript - Full type safety

### Step 4: Testing

Test your tool thoroughly:

- [ ] Functionality - All features work as expected
- [ ] Responsive Design - Works on mobile, tablet, and desktop
- [ ] Accessibility - Screen reader compatible, keyboard navigation
- [ ] Performance - No performance regressions
- [ ] Error Handling - Graceful error states
- [ ] Browser Compatibility - Works in Chrome, Firefox, Safari, Edge

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Avoid `any` type - use proper typing
- Use utility types when appropriate

### React

- Use functional components with hooks
- Follow React best practices
- Use proper dependency arrays in useEffect
- Memoize expensive computations with useMemo/useCallback

### Styling

- Use Tailwind CSS utility classes
- Follow the established design system
- Use CSS custom properties for theming
- Ensure responsive design

### File Structure

```
src/app/tools/[category]/[tool-name]/
├── page.tsx              # Main tool component
├── components/           # Tool-specific components (if needed)
├── hooks/               # Tool-specific hooks (if needed)
└── utils/               # Tool-specific utilities (if needed)
```

### Naming Conventions

- Files: kebab-case (`my-tool-name.tsx`)
- Components: PascalCase (`MyToolComponent`)
- Functions: camelCase (`processData`)
- Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- Types/Interfaces: PascalCase (`ToolConfig`)

## Testing Guidelines

### Manual Testing Checklist

- [ ] Input Validation - Handles invalid inputs gracefully
- [ ] Edge Cases - Works with empty, very large, or special inputs
- [ ] Performance - No lag with large datasets
- [ ] Accessibility - Screen reader friendly, keyboard navigation
- [ ] Mobile - Touch-friendly, responsive layout
- [ ] Dark Mode - Proper contrast and visibility
- [ ] Error States - Clear error messages and recovery options

### Automated Testing

While we don't have comprehensive test coverage yet, consider adding:

- Unit tests for utility functions
- Integration tests for complex workflows
- E2E tests for critical user journeys

## Pull Request Process

### Before Submitting

1. **Ensure your code follows standards**

   ```bash
   pnpm lint
   pnpm type-check
   ```

2. **Test thoroughly**

   - Test on multiple browsers
   - Test on mobile devices
   - Test accessibility features

3. **Update documentation**
   - Update README if needed
   - Add inline documentation
   - Update tool configuration

### Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Manual testing completed
- [ ] Accessibility tested
- [ ] Mobile responsive tested
- [ ] Cross-browser tested

## Screenshots

Add screenshots if UI changes

## Checklist

- [ ] Code follows project standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance impact considered
```

### Review Process

1. Automated Checks - CI/CD pipeline runs tests
2. Code Review - Maintainers review your code
3. Testing - Manual testing by maintainers
4. Approval - PR approved and merged

## Reporting Issues

### Bug Report Template

```markdown
## Bug Description

Clear description of the bug

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior

What should happen

## Actual Behavior

What actually happens

## Environment

- Browser: [e.g. Chrome 120]
- OS: [e.g. Windows 11]
- Device: [e.g. Desktop, Mobile]

## Screenshots

Add screenshots if applicable

## Additional Context

Any other context about the problem
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `priority: high` - High priority issues
- `priority: low` - Low priority issues

## Feature Requests

### Feature Request Template

```markdown
## Feature Description

Clear description of the feature

## Problem Statement

What problem does this solve?

## Proposed Solution

How should this work?

## Alternatives Considered

Other solutions you've considered

## Additional Context

Any other context or screenshots
```

## Recognition

Contributors are recognized in several ways:

- Contributors List - Added to GitHub contributors
- Release Notes - Mentioned in release announcements
- Documentation - Credit in relevant documentation
- Community - Recognition in community channels

## Getting Help

If you need help with contributing:

- GitHub Issues - For bug reports and feature requests
- GitHub Discussions - For questions and general discussion
- Documentation - Check existing documentation first
- Code Examples - Look at existing tools for patterns

## Contribution Ideas

Looking for ideas? Here are some areas that need help:

- New Tools - Add tools to existing categories
- Tool Improvements - Enhance existing tools
- Performance - Optimize slow operations
- Accessibility - Improve accessibility features
- Documentation - Improve or add documentation
- Testing - Add test coverage
- UI/UX - Improve user experience

Thank you for contributing to Toolify!
