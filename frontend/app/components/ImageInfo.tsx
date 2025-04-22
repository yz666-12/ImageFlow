import { ImageFile } from "../types";
import { ImageData } from "../types/image"; 
import { getFormatLabel, getOrientationLabel, formatFileSize } from "../utils/imageUtils";

type ImageType = ImageFile | (ImageData & { status: 'success' });

interface ImageInfoProps {
  image: ImageType;
}

export const ImageInfo = ({ image }: ImageInfoProps) => {
  // 判断图片类型
  const isImageFile = 'url' in image && 'size' in image;
  
  // 获取展示信息
  const format = (image.format || '').toLowerCase();
  const orientation = image.orientation || '';
  const size = isImageFile ? (image as ImageFile).size : 0;
  const path = image.path || '';
  const width = 'width' in image ? image.width : undefined;
  const height = 'height' in image ? image.height : undefined;
  const expiryTime = 'expiryTime' in image ? image.expiryTime : undefined;

  return (
    <div className="space-y-1 mt-2">
      {/* 标签组 */}
      <div className="flex flex-wrap gap-1 mb-2">
        {format && (
          <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            format === 'gif'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300'
          }`}>
            {getFormatLabel(format)}
          </div>
        )}
        
        {orientation && (
          <div className="flex items-center bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 px-3 py-1 rounded-full text-xs font-medium">
            {getOrientationLabel(orientation)}
          </div>
        )}
        
        {isImageFile && (
          <div className="flex items-center bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium">
            {formatFileSize(size)}
          </div>
        )}
        
        {width && height && (
          <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-medium">
            {width} x {height}
          </div>
        )}
        
        {expiryTime && (
          <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-300 px-3 py-1 rounded-full text-xs font-medium">
            过期: {new Date(expiryTime).toLocaleString()}
          </div>
        )}
      </div>

      {/* 图片路径 */}
      {path && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">路径</label>
          <div className="font-mono text-xs bg-gray-50 dark:bg-gray-800 p-1 rounded text-gray-700 dark:text-gray-300 truncate">
            {path}
          </div>
        </div>
      )}
    </div>
  );
}; 