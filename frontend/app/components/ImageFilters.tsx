import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ImageFiltersProps } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../utils/request";

export default function ImageFilters({ onFilterChange }: ImageFiltersProps) {
  const [format, setFormat] = useState("webp");
  const [orientation, setOrientation] = useState("all");
  const [tag, setTag] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [activeDropdown, setActiveDropdown] = useState<"format" | "orientation" | "tag" | null>(null);

  const dropdownRefs = {
    format: useRef<HTMLDivElement>(null),
    orientation: useRef<HTMLDivElement>(null),
    tag: useRef<HTMLDivElement>(null)
  };

  const formatOptions = useMemo(() => [
    { value: "webp", label: "图片" },
    { value: "gif", label: "GIF" }
  ], []);

  const orientationOptions = useMemo(() => [
    { value: "all", label: "方向" },
    { value: "landscape", label: "横向" },
    { value: "portrait", label: "纵向" }
  ], []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await api.get<{ tags: string[] }>("/api/tags");
        if (response.tags && response.tags.length > 0) {
          setAvailableTags(response.tags);
        }
      } catch (error) {
        console.error("获取标签失败:", error);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!Object.values(dropdownRefs).some(ref => 
        ref.current && ref.current.contains(event.target as Node)
      )) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFilterChange = useCallback((type: string, value: string) => {
    switch (type) {
      case "format":
        setFormat(value);
        onFilterChange(value, orientation, tag);
        break;
      case "orientation":
        setOrientation(value);
        onFilterChange(format, value, tag);
        break;
      case "tag":
        setTag(value);
        onFilterChange(format, orientation, value);
        break;
    }
    setActiveDropdown(null);
  }, [format, orientation, tag, onFilterChange]);

  // 过滤标签
  const filteredTags = useMemo(() => 
    searchQuery.trim() === ""
      ? availableTags
      : availableTags.filter(t => 
          t.toLowerCase().includes(searchQuery.toLowerCase())
        ),
    [availableTags, searchQuery]
  );

  // 渲染下拉按钮
  const renderDropdownButton = useCallback((type: "format" | "orientation" | "tag") => {
    const getButtonLabel = () => {
      switch (type) {
        case "format":
          return formatOptions.find(opt => opt.value === format)?.label || "选择格式";
        case "orientation":
          return orientationOptions.find(opt => opt.value === orientation)?.label || "选择方向";
        case "tag":
          return tag || "选择标签";
      }
    };

    return (
      <button
        onClick={() => setActiveDropdown(activeDropdown === type ? null : type)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
          activeDropdown === type
            ? "bg-indigo-500 text-white"
            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        }`}
      >
        {getButtonLabel()}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${
            activeDropdown === type ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    );
  }, [activeDropdown, format, orientation, tag, formatOptions, orientationOptions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 flex items-center gap-4 flex-wrap"
    >
      {/* 格式筛选 */}
      <div className="relative" ref={dropdownRefs.format}>
        {renderDropdownButton("format")}
        <AnimatePresence>
          {activeDropdown === "format" && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
            >
              {formatOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange("format", option.value)}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    format === option.value
                      ? "text-indigo-500 font-medium"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 方向筛选 */}
      <div className="relative" ref={dropdownRefs.orientation}>
        {renderDropdownButton("orientation")}
        <AnimatePresence>
          {activeDropdown === "orientation" && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
            >
              {orientationOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange("orientation", option.value)}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    orientation === option.value
                      ? "text-indigo-500 font-medium"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 标签筛选 */}
      <div className="relative" ref={dropdownRefs.tag}>
        {renderDropdownButton("tag")}
        <AnimatePresence>
          {activeDropdown === "tag" && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
            >
              <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索标签..."
                    className="w-full px-3 py-2 pl-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 text-sm"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto">
                <button
                  onClick={() => handleFilterChange("tag", "")}
                  className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    tag === "" ? "text-indigo-500 font-medium" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  全部
                </button>
                {filteredTags.map(tagItem => (
                  <button
                    key={tagItem}
                    onClick={() => handleFilterChange("tag", tagItem)}
                    className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      tag === tagItem
                        ? "text-indigo-500 font-medium"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {tagItem}
                  </button>
                ))}
                {filteredTags.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                    未找到匹配的标签
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
