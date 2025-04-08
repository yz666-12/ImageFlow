import Image from "next/image";
import { ImageFile } from "../types";
import { getFullUrl } from "../utils/baseUrl";

interface ImagePreviewProps {
  image: ImageFile;
}

export const ImagePreview = ({ image }: ImagePreviewProps) => {
  if (image.format.toLowerCase() === "gif") {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <img
          src={getFullUrl(image.url)}
          alt={image.filename}
          className="max-h-full max-w-full object-contain"
        />
        <a
          href={getFullUrl(image.url)}
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
    <Image
      src={getFullUrl(image.url)}
      alt={image.filename}
      fill
      className="object-contain"
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
};
