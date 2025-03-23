'use client'

export default function UsageTips() {
  return (
    <div className="card p-5 mb-8">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        使用提示
      </h3>
      <ul className="text-sm text-light-text-secondary dark:text-dark-text-secondary space-y-2 list-disc list-inside">
        <li>支持一次上传多张图片，可以拖放或点击选择</li>
        <li>上传前可预览所有选中的图片，并可单独删除不需要的图片</li>
        <li>每张图片将自动转换为多种格式，以提升加载速度</li>
        <li>上传完成后，您可以查看每张图片的详细信息和访问链接</li>
      </ul>
    </div>
  )
} 