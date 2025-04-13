import { getFullUrl } from "./baseUrl";
import { ImageFile } from "../types";

/**
 * 复制文本到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("复制失败:", err);
    return false;
  }
};

/**
 * 构建Markdown图片链接
 */
export const buildMarkdownLink = (url: string, altText: string): string => {
  return `![${altText}](${url})`;
};

/**
 * 构建HTML图片标签
 */
export const buildHtmlImgTag = (url: string, altText: string): string => {
  return `<img src="${url}" alt="${altText}" />`;
};

/**
 * 复制图片链接（原始格式）
 */
export const copyOriginalUrl = async (image: ImageFile): Promise<boolean> => {
  const url = getFullUrl(image.urls?.original || image.url);
  return copyToClipboard(url);
};

/**
 * 复制图片链接（WebP格式）
 */
export const copyWebpUrl = async (image: ImageFile): Promise<boolean> => {
  const url = getFullUrl(image.urls?.webp || "");
  return copyToClipboard(url);
};

/**
 * 复制图片链接（AVIF格式）
 */
export const copyAvifUrl = async (image: ImageFile): Promise<boolean> => {
  const url = getFullUrl(image.urls?.avif || "");
  return copyToClipboard(url);
};

/**
 * 复制Markdown格式的图片链接
 */
export const copyMarkdownLink = async (image: ImageFile): Promise<boolean> => {
  // 优先使用WebP链接
  const url = getFullUrl(image.urls?.webp || image.urls?.original || image.url);
  const markdown = buildMarkdownLink(url, image.filename);
  return copyToClipboard(markdown);
};

/**
 * 复制HTML格式的图片标签
 */
export const copyHtmlImgTag = async (image: ImageFile): Promise<boolean> => {
  // 优先使用WebP链接
  const url = getFullUrl(image.urls?.webp || image.urls?.original || image.url);
  const html = buildHtmlImgTag(url, image.filename);
  return copyToClipboard(html);
}; 