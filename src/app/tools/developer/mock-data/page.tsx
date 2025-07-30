"use client";

import { ToolLayout } from "@/components/layout/tool-layout";
import { ActionButtons } from "@/components/tools/action-buttons";
import { ProcessingStatus } from "@/components/tools/processing-status";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAnimations } from "@/stores/settings-store";
import { m, useInView } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Mock data generator tool for creating test data in various formats
 */
export default function MockDataPage() {
  const animationsEnabled = useAnimations();
  const [dataType, setDataType] = useLocalStorage("mock-data-type", "users");
  const [count, setCount] = useLocalStorage("mock-data-count", 5);
  const [format, setFormat] = useLocalStorage("mock-data-format", "json");
  const [generatedData, setGeneratedData] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ type: string; count: number; format: string; timestamp: number }>
  >("mock-data-history", []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  // Mock data generators
  const mockGenerators = {
    users: () => ({
      id: Math.floor(Math.random() * 10000),
      name: `User ${Math.floor(Math.random() * 1000)}`,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      age: Math.floor(Math.random() * 50) + 18,
      city: ["New York", "London", "Tokyo", "Paris", "Berlin"][
        Math.floor(Math.random() * 5)
      ],
      isActive: Math.random() > 0.5,
      createdAt: new Date(
        Date.now() - Math.random() * 10000000000,
      ).toISOString(),
    }),
    products: () => ({
      id: Math.floor(Math.random() * 10000),
      name: `Product ${Math.floor(Math.random() * 1000)}`,
      price: parseFloat((Math.random() * 1000).toFixed(2)),
      category: ["Electronics", "Clothing", "Books", "Home", "Sports"][
        Math.floor(Math.random() * 5)
      ],
      inStock: Math.random() > 0.3,
      rating: parseFloat((Math.random() * 5).toFixed(1)),
      description: `This is a sample product description for ${Math.floor(Math.random() * 1000)}`,
    }),
    posts: () => ({
      id: Math.floor(Math.random() * 10000),
      title: `Post Title ${Math.floor(Math.random() * 1000)}`,
      content: `This is sample content for post ${Math.floor(Math.random() * 1000)}. It contains some random text to simulate a real blog post.`,
      author: `Author ${Math.floor(Math.random() * 100)}`,
      published: Math.random() > 0.2,
      tags: ["tech", "design", "business", "lifestyle"].slice(
        0,
        Math.floor(Math.random() * 4) + 1,
      ),
      createdAt: new Date(
        Date.now() - Math.random() * 10000000000,
      ).toISOString(),
    }),
    orders: () => ({
      id: Math.floor(Math.random() * 10000),
      customerId: Math.floor(Math.random() * 1000),
      total: parseFloat((Math.random() * 1000).toFixed(2)),
      status: ["pending", "processing", "shipped", "delivered", "cancelled"][
        Math.floor(Math.random() * 5)
      ],
      items: Math.floor(Math.random() * 10) + 1,
      createdAt: new Date(
        Date.now() - Math.random() * 10000000000,
      ).toISOString(),
    }),
  };

  /**
   * Generate mock data based on selected type and format
   */
  const generateMockData = () => {
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const generator = mockGenerators[dataType as keyof typeof mockGenerators];
      const data = Array.from({ length: count }, () => generator());

      let formattedData = "";

      if (format === "json") {
        formattedData = JSON.stringify(data, null, 2);
      } else if (format === "csv") {
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(",");
        const csvRows = data.map((item) =>
          headers
            .map((header) => {
              const value = item[header as keyof typeof item];
              return typeof value === "string" ? `"${value}"` : value;
            })
            .join(","),
        );
        formattedData = [csvHeaders, ...csvRows].join("\n");
      } else if (format === "xml") {
        const xmlItems = data.map((item) => {
          const itemXml = Object.entries(item)
            .map(([key, value]) => {
              if (Array.isArray(value)) {
                return `<${key}>${value.join(", ")}</${key}>`;
              }
              return `<${key}>${value}</${key}>`;
            })
            .join("");
          return `<${dataType.slice(0, -1)}>${itemXml}</${dataType.slice(0, -1)}>`;
        });
        formattedData = `<?xml version="1.0" encoding="UTF-8"?>\n<${dataType}>${xmlItems.join("\n")}</${dataType}>`;
      }

      setGeneratedData(formattedData);
      setIsComplete(true);

      // Add to history
      const newEntry = {
        type: dataType,
        count,
        format,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);

      toast.success(
        `Generated ${count} ${dataType} in ${format.toUpperCase()} format`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate mock data";
      setError(errorMessage);
      toast.error("Failed to generate mock data");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy generated data to clipboard
   */
  const copyData = () => {
    navigator.clipboard.writeText(generatedData);
    toast.success("Data copied to clipboard");
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setGeneratedData("");
    setIsComplete(false);
    setError(null);
    toast.success("All data cleared");
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId="dev-mock-data">
      <div ref={containerRef} className="space-y-6">
        <MotionDiv
          variants={variants}
          initial="hidden"
          animate={isInView && animationsEnabled ? "visible" : "hidden"}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data-type">Data Type</Label>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="products">Products</SelectItem>
                  <SelectItem value="posts">Posts</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Count: {count}</Label>
              <Slider
                value={[count]}
                onValueChange={(value) => setCount(value[0])}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ActionButtons
            onGenerate={generateMockData}
            onClear={clearAll}
            generateLabel="Generate Data"
            clearLabel="Clear All"
            isGenerating={isProcessing}
          />
        </MotionDiv>

        <ProcessingStatus
          isProcessing={isProcessing}
          isComplete={isComplete}
          error={error}
        />

        {generatedData && (
          <MotionDiv
            variants={variants}
            initial="hidden"
            animate={isInView && animationsEnabled ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Generated{" "}
                  {dataType.charAt(0).toUpperCase() + dataType.slice(1)} (
                  {format.toUpperCase()})
                  <button
                    onClick={copyData}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedData}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </MotionDiv>
        )}

        {history.length > 0 && (
          <MotionDiv
            variants={variants}
            initial="hidden"
            animate={isInView && animationsEnabled ? "visible" : "hidden"}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold">Recent History</h3>
            <div className="space-y-2">
              {history.map((entry, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium capitalize">{entry.type}</p>
                          <Badge variant="secondary">{entry.count} items</Badge>
                          <Badge variant="outline">
                            {entry.format.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDataType(entry.type);
                          setCount(entry.count);
                          setFormat(entry.format);
                          toast.success("Settings restored from history");
                        }}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        Restore
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </MotionDiv>
        )}
      </div>
    </ToolLayout>
  );
}
