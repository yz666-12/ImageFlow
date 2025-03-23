import { useState } from 'react';
import { validateApiKey } from '../utils/auth';
import { ApiKeyModalProps } from '../types';

export default function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
    const [apiKey, setApiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsValidating(true);
        setError('');

        try {
            const isValid = await validateApiKey(apiKey);
            if (isValid) {
                onSuccess(apiKey);
            } else {
                setError('API Key无效,请重试');
            }
        } catch (err) {
            setError('验证失败,请重试');
        } finally {
            setIsValidating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">请输入API Key</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="输入您的API Key"
                        required
                    />
                    {error && (
                        <p className="text-red-500 mb-4">{error}</p>
                    )}
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isValidating}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isValidating ? '验证中...' : '验证'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 