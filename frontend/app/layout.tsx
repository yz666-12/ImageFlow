import type { Metadata } from "next";
import { Inter, Noto_Sans_SC } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], display: "swap", weight: ["400","700"] });
const notoSansSC = Noto_Sans_SC({ subsets: ["latin"], weight: ["700"], display: "swap" });

export const metadata: Metadata = {
  title: "ImageFlow - 图片管理",
  description: "一个简单而强大的图片管理工具",
  icons: {
    icon: [
      { url: "/static/favicon.ico", sizes: "any" },
      { url: "/static/favicon.svg", type: "image/svg+xml" },
      { url: "/static/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/static/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/static/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/static/favicon-48.png", sizes: "48x48", type: "image/png" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="light">
      {/* 半透明 + 毛玻璃（仅浏览器支持时生效） */}
      <body className={`${inter.className} ${notoSansSC.className} py-10 font-bold min-h-screen bg-white/20 supports-[backdrop-filter]:backdrop-blur-2xl transition-colors duration-300`}>
        {/* 固定背景图层，给毛玻璃提供“可被模糊”的内容；可换成渐变 */}
        <div className="fixed inset-0 -z-10 bg-[url('/static/bg.jpg')] bg-cover bg-center" />

        {children}

        {/* 页脚 */}
        <div className="max-w-7xl mx-auto px-6 mt-8 text-center text-gray-600 dark:text-gray-400">
          Create By{" "}
          <a
            href="https://catcat.blog/"
            target="_blank"
            className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
          >
            sakura博客
          </a>
        </div>

        {/* 把樱花 canvas 放顶层且不挡点击 */}
        <style jsx global>{`
          canvas#sakura, canvas.sakura, .sakura-container, #sakura-container {
            position: fixed !important;
            inset: 0 !important;
            pointer-events: none !important;
            z-index: 9999 !important;
          }
        `}</style>

        {/* 第三方樱花脚本（失败时回退到本地 /sakura.js） */}
        <Script
          src="https://cdn.jsdelivr.net/gh/yremp/yremp-js@1.5/sakura.js?v=20250824"
          strategy="afterInteractive"
          onLoad={() => {
            // 一些版本需要手动初始化，做几种兜底
            // @ts-ignore
            if (typeof window !== "undefined") {
              // @ts-ignore
              if (window.Sakura && typeof window.Sakura === "function") { try { new window.Sakura("body"); } catch(e){} }
              // @ts-ignore
              if (window.sakura && typeof window.sakura === "function") { try { window.sakura(); } catch(e){} }
              // @ts-ignore
              if (window.createSakura && typeof window.createSakura === "function") { try { window.createSakura(); } catch(e){} }
            }
            console.log("[sakura] cdn loaded");
          }}
          onError={() => {
            console.warn("[sakura] cdn failed, using local /sakura.js");
            const s = document.createElement("script");
            s.src = "/sakura.js?v=20250824";
            s.onload = () => {
              // @ts-ignore
              if (window.Sakura && typeof window.Sakura === "function") { try { new window.Sakura("body"); } catch(e){} }
              // @ts-ignore
              if (window.sakura && typeof window.sakura === "function") { try { window.sakura(); } catch(e){} }
              // @ts-ignore
              if (window.createSakura && typeof window.createSakura === "function") { try { window.createSakura(); } catch(e){} }
              console.log("[sakura] local loaded");
            };
            document.body.appendChild(s);
          }}
        />
      </body>
    </html>
  );
}
