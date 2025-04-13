import Image from "next/image";
import { ImageFile } from "../types";
import { getFullUrl } from "../utils/baseUrl";
import { useState, useEffect, useCallback } from "react";
import { imageQueue } from "../utils/imageQueue";

interface ImagePreviewProps {
  image: ImageFile;
  priority?: boolean;
  onLoad?: () => void;
  quality?: number;
}

export const ImagePreview = ({ 
  image, 
  priority = false, 
  onLoad,
  quality = 20 
}: ImagePreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [blurDataUrl, setBlurDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageUrl = getFullUrl(image.url);

  // Memoize the load handler
  const handleLoadComplete = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const loadImage = async () => {
      try {
        // Generate placeholder for non-GIF images
        if (image.format.toLowerCase() !== "gif") {
          const placeholder = await generateBlurPlaceholder(imageUrl);
          setBlurDataUrl(placeholder);
        }

        // Add to queue with priority flag
        if (!imageQueue.isPreloaded(imageUrl)) {
          imageQueue.add(imageUrl, priority);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load image");
        setIsLoading(false);
      }
    };

    loadImage();

    // Clean up on unmount
    return () => {
      setBlurDataUrl(null);
    };
  }, [imageUrl, priority, image.format]);

  const generateBlurPlaceholder = async (imageUrl: string) => {
    // Generate a more detailed placeholder
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <filter id="b" color-interpolation-filters="sRGB">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <rect width="100%" height="100%" filter="url(#b)" opacity="0.5"/>
      </svg>`
    ).toString('base64')}`;
  };

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-500">
        <span>Failed to load image</span>
      </div>
    );
  }

  if (image.format.toLowerCase() === "gif") {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <img
          src={imageUrl}
          alt={image.filename}
          className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          loading={priority ? "eager" : "lazy"}
          onLoad={handleLoadComplete}
          onError={() => setError("Failed to load GIF")}
        />
        <a
          href={imageUrl}
          download={image.filename}
          className="absolute bottom-4 right-4 bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full shadow-lg transition-colors duration-300"
          onClick={(e) => e.stopPropagation()}
          title="下载GIF"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Image
        src={imageUrl}
        alt={image.filename}
        fill
        className={`object-contain transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        quality={quality}
        placeholder="blur"
        blurDataURL={blurDataUrl || undefined}
        onLoadingComplete={handleLoadComplete}
        onError={() => setError("Failed to load image")}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};
