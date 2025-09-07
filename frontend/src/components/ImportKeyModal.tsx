import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import apiService from '../services/api';
import { X, Upload, Eye, Check, AlertCircle } from 'lucide-react';
import { KeyPreview } from '../types';

interface ImportKeyForm {
  publicKey: string;
  comment: string;
  expiresAt: string;
  authorizedKeysOptions: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const ImportKeyModal: React.FC<Props> = ({ onClose, onSuccess }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<KeyPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<ImportKeyForm>();

  const publicKeyValue = watch('publicKey');

  const handlePreview = async () => {
    if (!publicKeyValue?.trim()) {
      setError('Please enter a public key first');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.previewKey(publicKeyValue);
      if (response.success && response.data) {
        setPreview(response.data);
        setShowPreview(true);
      } else {
        setError(response.error || 'Failed to preview key');
      }
    } catch (err) {
      setError('Invalid SSH public key format');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ImportKeyForm) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.importKey(
        data.publicKey,
        data.comment || undefined,
        data.expiresAt || undefined,
        data.authorizedKeysOptions || undefined
      );

      if (response.success) {
        onSuccess();
      } else {
        setError(response.error || 'Failed to import SSH key');
      }
    } catch (err) {
      setError('Failed to import SSH key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Upload className="w-6 h-6 text-blue-600" />
            <span>Import SSH Key</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Public Key Input */}
            <div>
              <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700 mb-2">
                SSH Public Key *
              </label>
              <div className="relative">
                <textarea
                  {...register('publicKey', { required: 'Public key is required' })}
                  id="publicKey"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="Paste your SSH public key here (ssh-rsa, ssh-ed25519, or ecdsa-sha2-*)"
                />
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={isLoading || !publicKeyValue?.trim()}
                  className="absolute top-2 right-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </button>
              </div>
              {errors.publicKey && (
                <p className="mt-1 text-sm text-red-600">
                  {typeof errors.publicKey.message === 'string' 
                    ? errors.publicKey.message 
                    : 'Public key is required'}
                </p>
              )}
            </div>

            {/* Key Preview */}
            {showPreview && preview && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Key Preview</span>
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Algorithm:</span>
                    <span className="ml-2 text-gray-900">{preview.algorithm}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Bit Length:</span>
                    <span className="ml-2 text-gray-900">{preview.bitLength}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Fingerprint:</span>
                    <span className="ml-2 text-gray-900 font-mono">{preview.fingerprint}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comment (optional)
              </label>
              <input
                {...register('comment')}
                type="text"
                id="comment"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., laptop-work, desktop-home"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date (optional)
              </label>
              <input
                {...register('expiresAt')}
                type="datetime-local"
                id="expiresAt"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">Leave empty to use default TTL from policy</p>
            </div>

            {/* Authorized Keys Options */}
            <div>
              <label htmlFor="authorizedKeysOptions" className="block text-sm font-medium text-gray-700 mb-2">
                Authorized Keys Options (optional)
              </label>
              <input
                {...register('authorizedKeysOptions')}
                type="text"
                id="authorizedKeysOptions"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., no-agent-forwarding,from=192.168.1.0/24"
              />
              <p className="mt-1 text-xs text-gray-500">Comma-separated options like no-pty, restrict, from=CIDR</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !showPreview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Import Key</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImportKeyModal; 