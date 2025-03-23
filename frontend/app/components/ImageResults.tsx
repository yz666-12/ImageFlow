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
      {results.map((result, index) => (
        <ImageResult key={index} result={result} index={index} />
      ))}
    </motion.div>
  )
} 