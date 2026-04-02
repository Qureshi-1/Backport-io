"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Code, Terminal, Package, Copy, CheckCircle2, ArrowRight } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";

const SDK_LANGUAGES = ["Node.js", "Python", "Go", "cURL"];

const sdks = {
  "Node.js": {
    install: "npm install backport-sdk",
    basic: `import { Backport } from 'backport-sdk';

const client = new Backport({
  apiKey: process.env.BACKPORT_API_KEY,
  gateway: 'https://backport-io.vercel.app'
});

// Simple GET request
const users = await client.get('/api/users');

// GET with query params
const products = await client.get('/api/products', {
  params: { category: 'electronics', limit: 10 }
});

// POST with body
const order = await client.post('/api/orders', {
  body: { productId: 123, quantity: 2 }
});

// POST with idempotency (for payments)
const payment = await client.post('/api/checkout', {
  body: { amount: 5000, currency: 'INR' },
  idempotencyKey: 'txn_' + Date.now()
});

// DELETE request
await client.delete('/api/orders/123');

// Custom headers
const data = await client.get('/api/private', {
  headers: { 'X-Custom-Header': 'value' }
});`,
    advance: `import { Backport } from 'backport-sdk';

const client = new Backport({
  apiKey: process.env.BACKPORT_API_KEY,
  gateway: 'https://backport-io.vercel.app',
  timeout: 30000, // 30 seconds
  retries: 3,    // Retry on failure
});

// Batch requests
const [users, products, orders] = await Promise.all([
  client.get('/api/users'),
  client.get('/api/products'),
  client.get('/api/orders'),
]);

// Request with custom rate limit
const result = await client.post('/api/bulk-action', {
  body: { ids: [1, 2, 3] },
  rateLimit: { requests: 10, window: 60000 } // 10 req/min
});

// Stream responses (for large data)
const stream = await client.get('/api/large-data', { stream: true });
for await (const chunk of stream) {
  console.log(chunk);
}`
  },
  "Python": {
    install: "pip install backport-sdk",
    basic: `import backport

client = backport.Client(
    api_key="bk_live_xxx",
    gateway="https://backport-io.vercel.app"
)

# Simple GET request
users = client.get("/api/users")

# GET with query params
products = client.get("/api/products", params={"category": "electronics", "limit": 10})

# POST with body
order = client.post("/api/orders", json={"productId": 123, "quantity": 2})

# POST with idempotency (for payments)
payment = client.post("/api/checkout",
    json={"amount": 5000, "currency": "INR"},
    idempotency_key="txn_" + str(int(time.time()))
)

# DELETE request
client.delete("/api/orders/123")

# Custom headers
data = client.get("/api/private", headers={"X-Custom-Header": "value"})`,
    advance: `import backport
from backport import RateLimit, RetryConfig

client = backport.Client(
    api_key="bk_live_xxx",
    gateway="https://backport-io.vercel.app",
    timeout=30,  # 30 seconds
    retries=3,   # Retry on failure
    retry_config=RetryConfig(
        on=[500, 502, 503, 504],
        backoff_factor=0.5
    )
)

# Batch requests
import asyncio

async def fetch_all():
    users, products, orders = await asyncio.gather(
        client.get_async("/api/users"),
        client.get_async("/api/products"),
        client.get_async("/api/orders"),
    )
    return users, products, orders

# Context manager for connection pooling
with client:
    users = client.get("/api/users")
    products = client.get("/api/products")`
  },
  "Go": {
    install: "go get github.com/backport-io/backport-go",
    basic: `package main

import (
    "fmt"
    backport "github.com/backport-io/backport-go"
)

func main() {
    client := backport.NewClient("bk_live_xxx",
        backport.WithGateway("https://backport-io.vercel.app"),
    )

    // Simple GET request
    users, err := client.Get("/api/users")
    if err != nil {
        panic(err)
    }
    fmt.Println(users)

    // GET with query params
    products, err := client.Get("/api/products", backport.WithParams(map[string]string{
        "category": "electronics",
        "limit": "10",
    }))

    // POST with body
    order, err := client.Post("/api/orders", map[string]interface{}{
        "productId": 123,
        "quantity": 2,
    })

    // POST with idempotency (for payments)
    payment, err := client.Post("/api/checkout",
        map[string]interface{}{"amount": 5000, "currency": "INR"},
        backport.WithIdempotencyKey("txn_12345"),
    )

    // DELETE request
    err = client.Delete("/api/orders/123")`,
    advance: `package main

import (
    "context"
    "time"
    backport "github.com/backport-io/backport-go"
)

func main() {
    client := backport.NewClient("bk_live_xxx",
        backport.WithGateway("https://backport-io.vercel.app"),
        backport.WithTimeout(30*time.Second),
        backport.WithRetry(3),
    )

    ctx := context.Background()

    // With context
    users, err := client.GetContext(ctx, "/api/users")

    // Concurrent requests
    results, err := client.Concurrent(func(c *backport.Client) (interface{}, error) {
        return c.Get("/api/users")
    }, func(c *backport.Client) (interface{}, error) {
        return c.Get("/api/products")
    })
}`
  },
  "cURL": {
    install: "# No installation required - just use curl",
    basic: `# Simple GET request
curl -X GET "https://backport-io.vercel.app/proxy/api/users" \\
  -H "X-API-Key: bk_live_xxx"

# GET with query params
curl -X GET "https://backport-io.vercel.app/proxy/api/products?category=electronics&limit=10" \\
  -H "X-API-Key: bk_live_xxx"

# POST with body
curl -X POST "https://backport-io.vercel.app/proxy/api/orders" \\
  -H "X-API-Key: bk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{"productId": 123, "quantity": 2}'

# POST with idempotency (for payments)
curl -X POST "https://backport-io.vercel.app/proxy/api/checkout" \\
  -H "X-API-Key: bk_live_xxx" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: txn_12345" \\
  -d '{"amount": 5000, "currency": "INR"}'

# DELETE request
curl -X DELETE "https://backport-io.vercel.app/proxy/api/orders/123" \\
  -H "X-API-Key: bk_live_xxx"

# With custom headers
curl -X GET "https://backport-io.vercel.app/proxy/api/private" \\
  -H "X-API-Key: bk_live_xxx" \\
  -H "X-Custom-Header: value"`,
    advance: `# Retry on failure
curl --retry 3 --retry-delay 2 \\
  -X GET "https://backport-io.vercel.app/proxy/api/users" \\
  -H "X-API-Key: bk_live_xxx"

# Timeout
curl --max-time 30 \\
  -X GET "https://backport-io.vercel.app/proxy/api/users" \\
  -H "X-API-Key: bk_live_xxx"

# Follow redirects
curl -L \\
  -X GET "https://backport-io.vercel.app/proxy/api/users" \\
  -H "X-API-Key: bk_live_xxx"

# Save response to file
curl -o response.json \\
  -X GET "https://backport-io.vercel.app/proxy/api/users" \\
  -H "X-API-Key: bk_live_xxx"

# Upload file
curl -X POST "https://backport-io.vercel.app/proxy/api/upload" \\
  -H "X-API-Key: bk_live_xxx" \\
  -F "file=@myfile.txt"`
  }
};

export default function SDKPage() {
  const [selectedLang, setSelectedLang] = useState("Node.js");
  const [activeTab, setActiveTab] = useState("basic");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-black text-zinc-300">
      <MatrixBackground />
      
      <div className="max-w-6xl mx-auto px-6 py-24 relative z-10">
        {/* Back link */}
        <Link href="/docs" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Docs
        </Link>

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            CLIENT SDKS
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Integrate with Your <span className="text-emerald-400">Favorite Language</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Official SDKs for Node.js, Python, Go, and more. Get started in minutes.
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {SDK_LANGUAGES.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                selectedLang === lang
                  ? 'bg-emerald-500 text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* SDK Content */}
        <div className="bg-zinc-900/50 rounded-2xl border border-white/5 overflow-hidden mb-12">
          {/* Install */}
          <div className="p-6 border-b border-white/5 bg-zinc-950/50">
            <div className="flex items-center gap-3 mb-3">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-bold">Installation</span>
            </div>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-black rounded-lg px-4 py-3 text-emerald-400 font-mono text-sm overflow-x-auto">
                {sdks[selectedLang as keyof typeof sdks].install}
              </code>
              <button
                onClick={() => copyToClipboard(sdks[selectedLang as keyof typeof sdks].install)}
                className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => setActiveTab("basic")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "basic"
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Basic Usage
            </button>
            <button
              onClick={() => setActiveTab("advance")}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === "advance"
                  ? 'text-emerald-400 border-b-2 border-emerald-400'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              Advanced
            </button>
          </div>

          {/* Code */}
          <div className="relative">
            <button
              onClick={() => copyToClipboard(sdks[selectedLang as keyof typeof sdks][activeTab as "basic" | "advance"])}
              className="absolute top-4 right-4 p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors z-10"
            >
              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm text-zinc-300 font-mono whitespace-pre">
                {sdks[selectedLang as keyof typeof sdks][activeTab as "basic" | "advance"]}
              </code>
            </pre>
          </div>
        </div>

        {/* Features */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            SDK <span className="text-emerald-400">Features</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "⚡", title: "Fast", desc: "Lightweight with minimal overhead" },
              { icon: "🔄", title: "Retry Logic", desc: "Automatic retry with backoff" },
              { icon: "🏊", title: "Connection Pooling", desc: "Efficient connection management" },
              { icon: "📝", title: "TypeScript", desc: "Full type definitions" },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/5 bg-zinc-900/30">
                <span className="text-3xl mb-3 block">{f.icon}</span>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Response Headers */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            Response <span className="text-emerald-400">Headers</span>
          </h2>
          <div className="bg-zinc-900/50 rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="p-4 text-zinc-400 font-medium">Header</th>
                  <th className="p-4 text-zinc-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { header: "X-Backport-Cache", desc: "HIT or MISS - indicates if response was cached" },
                  { header: "X-Backport-Idempotent", desc: "REPLAY if idempotent key was used" },
                  { header: "X-Backport-Latency", desc: "Request processing time in ms" },
                  { header: "X-RateLimit-Remaining", desc: "Remaining requests in current window" },
                  { header: "X-RateLimit-Reset", desc: "Unix timestamp when limit resets" },
                ].map((row) => (
                  <tr key={row.header} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-emerald-400">{row.header}</td>
                    <td className="p-4 text-zinc-400">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to <span className="text-emerald-400">Get Started</span>?
          </h2>
          <p className="text-zinc-400 mb-6">
            Get your API key and start protecting your backend in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-emerald-500 text-black px-8 py-4 rounded-xl font-bold hover:bg-emerald-400 transition-colors">
              Get API Key <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/docs" className="inline-flex items-center gap-2 border border-white/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-white/5 transition-colors">
              Read Full Docs
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
