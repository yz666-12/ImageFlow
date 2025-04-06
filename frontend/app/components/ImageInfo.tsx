import { ImageFile } from "../types";
import { getFormatLabel, getOrientationLabel, formatFileSize } from "../utils/imageUtils";

interface ImageInfoProps {
  image: ImageFile;
}

export const ImageInfo = ({ image }: ImageInfoProps) => {
  return (
    <div className="space-y-1 mt-2">
      {/* 标签组 */}
      <div className="flex flex-wrap gap-1 mb-2">
        <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          image.format.toLowerCase() === 'gif'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300'
            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
        }`}>
          {getFormatLabel(image.format)}
        </div>
        <div className="flex items-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
          {getOrientationLabel(image.orientation)}
        </div>
        <div className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium">
          {formatFileSize(image.size)}
        </div>
        {(image as any).width && (image as any).height && (
          <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-medium">
            {(image as any).width} x {(image as any).height}
          </div>
        )}
      </div>

      {/* 图片路径 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">路径</label>
        <div className="font-mono text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded text-gray-700 dark:text-gray-300 truncate">
          {image.path}
        </div>
      </div>
    </div>
  );
}; 