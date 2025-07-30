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
 * API mock generator tool for creating mock API endpoints and responses
 */
export default function ApiMockPage() {
  const animationsEnabled = useAnimations();
  const [endpointName, setEndpointName] = useLocalStorage(
    "api-mock-endpoint",
    "users",
  );
  const [httpMethod, setHttpMethod] = useLocalStorage("api-mock-method", "GET");
  const [responseType, setResponseType] = useLocalStorage(
    "api-mock-response",
    "array",
  );
  const [itemCount, setItemCount] = useLocalStorage("api-mock-count", 5);
  const [includePagination, setIncludePagination] = useLocalStorage(
    "api-mock-pagination",
    false,
  );
  const [generatedApi, setGeneratedApi] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useLocalStorage<
    Array<{ endpoint: string; method: string; type: string; timestamp: number }>
  >("api-mock-history", []);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  // Conditional motion components
  const MotionDiv = animationsEnabled ? m.div : "div";

  // Mock data generators
  const mockDataGenerators = {
    users: () => ({
      id: Math.floor(Math.random() * 10000),
      name: `User ${Math.floor(Math.random() * 1000)}`,
      email: `user${Math.floor(Math.random() * 1000)}@example.com`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
      role: ["admin", "user", "moderator"][Math.floor(Math.random() * 3)],
      isActive: Math.random() > 0.3,
      createdAt: new Date(
        Date.now() - Math.random() * 10000000000,
      ).toISOString(),
      lastLogin: new Date(
        Date.now() - Math.random() * 1000000000,
      ).toISOString(),
    }),
    products: () => ({
      id: Math.floor(Math.random() * 10000),
      name: `Product ${Math.floor(Math.random() * 1000)}`,
      description: `This is a sample product description for ${Math.floor(Math.random() * 1000)}`,
      price: parseFloat((Math.random() * 1000).toFixed(2)),
      category: ["Electronics", "Clothing", "Books", "Home", "Sports"][
        Math.floor(Math.random() * 5)
      ],
      inStock: Math.random() > 0.3,
      rating: parseFloat((Math.random() * 5).toFixed(1)),
      images: [`https://picsum.photos/300/200?random=${Math.random()}`],
      tags: ["featured", "new", "popular"].slice(
        0,
        Math.floor(Math.random() * 3) + 1,
      ),
    }),
    posts: () => ({
      id: Math.floor(Math.random() * 10000),
      title: `Post Title ${Math.floor(Math.random() * 1000)}`,
      content: `This is sample content for post ${Math.floor(Math.random() * 1000)}. It contains some random text to simulate a real blog post.`,
      author: {
        id: Math.floor(Math.random() * 1000),
        name: `Author ${Math.floor(Math.random() * 100)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
      },
      published: Math.random() > 0.2,
      tags: ["tech", "design", "business", "lifestyle"].slice(
        0,
        Math.floor(Math.random() * 4) + 1,
      ),
      createdAt: new Date(
        Date.now() - Math.random() * 10000000000,
      ).toISOString(),
      updatedAt: new Date(
        Date.now() - Math.random() * 1000000000,
      ).toISOString(),
    }),
    orders: () => ({
      id: Math.floor(Math.random() * 10000),
      customerId: Math.floor(Math.random() * 1000),
      items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, () => ({
        productId: Math.floor(Math.random() * 1000),
        name: `Product ${Math.floor(Math.random() * 1000)}`,
        quantity: Math.floor(Math.random() * 5) + 1,
        price: parseFloat((Math.random() * 100).toFixed(2)),
      })),
      total: parseFloat((Math.random() * 1000).toFixed(2)),
      status: ["pending", "processing", "shipped", "delivered", "cancelled"][
        Math.floor(Math.random() * 5)
      ],
      shippingAddress: {
        street: `${Math.floor(Math.random() * 9999)} Main St`,
        city: ["New York", "London", "Tokyo", "Paris", "Berlin"][
          Math.floor(Math.random() * 5)
        ],
        country: ["US", "UK", "JP", "FR", "DE"][Math.floor(Math.random() * 5)],
        zipCode: Math.floor(Math.random() * 99999).toString(),
      },
      createdAt: new Date(
        Date.now() - Math.random() * 10000000000,
      ).toISOString(),
    }),
  };

  /**
   * Generate mock API response
   */
  const generateMockApi = () => {
    setIsProcessing(true);
    setError(null);
    setIsComplete(false);

    try {
      const generator =
        mockDataGenerators[endpointName as keyof typeof mockDataGenerators];
      const data = Array.from({ length: itemCount }, () => generator());

      let response: any = {
        success: true,
        message: `${httpMethod} ${endpointName} successful`,
        timestamp: new Date().toISOString(),
      };

      if (responseType === "array") {
        response.data = data;
        if (includePagination) {
          response.pagination = {
            page: 1,
            limit: itemCount,
            total: itemCount * 10,
            totalPages: 10,
          };
        }
      } else if (responseType === "single") {
        response.data = data[0];
      } else if (responseType === "paginated") {
        response.data = data;
        response.pagination = {
          page: 1,
          limit: itemCount,
          total: itemCount * 10,
          totalPages: 10,
          hasNext: true,
          hasPrev: false,
        };
      }

      const apiResponse = {
        endpoint: `/${endpointName}`,
        method: httpMethod,
        response: response,
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      };

      setGeneratedApi(JSON.stringify(apiResponse, null, 2));
      setIsComplete(true);

      // Add to history
      const newEntry = {
        endpoint: endpointName,
        method: httpMethod,
        type: responseType,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);

      toast.success(`Generated ${httpMethod} /${endpointName} mock API`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate mock API";
      setError(errorMessage);
      toast.error("Failed to generate mock API");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Copy generated API to clipboard
   */
  const copyApi = () => {
    navigator.clipboard.writeText(generatedApi);
    toast.success("API response copied to clipboard");
  };

  /**
   * Clear all data
   */
  const clearAll = () => {
    setGeneratedApi("");
    setIsComplete(false);
    setError(null);
    toast.success("All data cleared");
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <ToolLayout toolId="dev-api-mock">
      <div ref={containerRef} className="space-y-6">
        <MotionDiv
          variants={variants}
          initial="hidden"
          animate={isInView && animationsEnabled ? "visible" : "hidden"}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endpoint-name">Endpoint</Label>
              <Select value={endpointName} onValueChange={setEndpointName}>
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
              <Label htmlFor="http-method">HTTP Method</Label>
              <Select value={httpMethod} onValueChange={setHttpMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="response-type">Response Type</Label>
              <Select value={responseType} onValueChange={setResponseType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="array">Array</SelectItem>
                  <SelectItem value="single">Single Item</SelectItem>
                  <SelectItem value="paginated">Paginated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-count">Item Count: {itemCount}</Label>
              <Slider
                value={[itemCount]}
                onValueChange={(value) => setItemCount(value[0])}
                max={20}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <ActionButtons
            onGenerate={generateMockApi}
            onClear={clearAll}
            generateLabel="Generate API"
            clearLabel="Clear All"
            isGenerating={isProcessing}
          />
        </MotionDiv>

        <ProcessingStatus
          isProcessing={isProcessing}
          isComplete={isComplete}
          error={error}
        />

        {generatedApi && (
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
                  Generated API Response
                  <button
                    onClick={copyApi}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedApi}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
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
                          <Badge variant="outline">{entry.method}</Badge>
                          <p className="font-medium">/{entry.endpoint}</p>
                          <Badge variant="secondary">{entry.type}</Badge>
                        </div>
                        <p className="text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEndpointName(entry.endpoint);
                          setHttpMethod(entry.method);
                          setResponseType(entry.type);
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
