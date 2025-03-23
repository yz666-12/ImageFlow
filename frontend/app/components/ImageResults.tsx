'use client'

import { motion } from 'framer-motion'
import ImageResult from './ImageResult'

interface ImageResultsProps {
  results: Array<{
    filename: string;
    status: 'success' | 'error';
    message: string;
    format?: string;
    urls?: {
      original: string;
      webp: string;
      avif: string;
    };
  }>;
}

export default function ImageResults({ results }: ImageResultsProps) {
  if (!results.length) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h2 className="text-xl font-semibold mb-4">已上传的图片</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {results.map((result, index) => (
          <ImageResult key={index} result={result} index={index} />
        ))}
      </div>
    </motion.div>
  )
} 