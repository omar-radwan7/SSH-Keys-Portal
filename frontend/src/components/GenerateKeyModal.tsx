import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import apiService from '../services/api';
import { X, Download, AlertCircle, Shield, Copy, ExternalLink } from 'lucide-react';

interface GenerateKeyForm {
  algorithm: string;
  bitLength: number;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const GenerateKeyModal: React.FC<Props> = ({ onClose, onSuccess }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showDownload, setShowDownload] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<GenerateKeyForm>({
    defaultValues: {
      algorithm: 'ssh-ed25519',
      bitLength: 256
    }
  });

  // Prefer explicit backend origin to avoid SPA dev-server handling navigation
  const backendOrigin = (window.location.origin.includes(':3001')
    ? window.location.origin.replace(':3001', ':3000')
    : window.location.origin);

  const onSubmit = async (data: GenerateKeyForm) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiService.generateKey(data.algorithm, data.bitLength);
      
      if (response.success && response.data) {
        setDownloadUrl(response.data.downloadUrl);
        setExpiresIn(response.data.expiresIn);
        setShowDownload(true);
      } else {
        setError(response.error || 'Failed to generate SSH key');
      }
    } catch (err) {
      setError('Failed to generate SSH key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const url = backendOrigin + downloadUrl;
    window.open(url, '_blank');
    onSuccess();
  };

  const copyDownloadUrl = async () => {
    try {
      await navigator.clipboard.writeText(backendOrigin + downloadUrl);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  if (showDownload) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="w-6 h-6 text-green-600" />
              <span>SSH Key Generated</span>
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Important Security Notice</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• This is a one-time download link that expires in {expiresIn} minutes</li>
                    <li>• The private key will be permanently deleted after download or expiry</li>
                    <li>• Use a strong passphrase to protect your private key</li>
                    <li>• Store your private key securely</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Download URL:</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={backendOrigin + downloadUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                  />
                  <button
                    onClick={copyDownloadUrl}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center space-x-1"
                    title="Copy URL"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Private Key</span>
                </button>
                <button
                  onClick={copyDownloadUrl}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
                  title="Copy download link"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Download className="w-6 h-6 text-green-600" />
            <span>Generate SSH Key</span>
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
            {/* Algorithm Selection */}
            <div>
              <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700 mb-2">
                Algorithm *
              </label>
              <select
                {...register('algorithm', { required: 'Algorithm is required' })}
                id="algorithm"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ssh-ed25519">Ed25519 (Recommended)</option>
                <option value="ssh-rsa">RSA</option>
                <option value="ecdsa-sha2-nistp256">ECDSA P-256</option>
              </select>
              {errors.algorithm && (
                <p className="mt-1 text-sm text-red-600">
                  {typeof errors.algorithm.message === 'string' 
                    ? errors.algorithm.message 
                    : 'Algorithm is required'}
                </p>
              )}
            </div>

            {/* Bit Length */}
            <div>
              <label htmlFor="bitLength" className="block text-sm font-medium text-gray-700 mb-2">
                Key Length *
              </label>
              <select
                {...register('bitLength', { 
                  required: 'Key length is required',
                  valueAsNumber: true 
                })}
                id="bitLength"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={256}>256 bits</option>
                <option value={2048}>2048 bits</option>
                <option value={3072}>3072 bits</option>
                <option value={4096}>4096 bits</option>
              </select>
                              {errors.bitLength && (
                  <p className="mt-1 text-sm text-red-600">
                    {typeof errors.bitLength.message === 'string' 
                      ? errors.bitLength.message 
                      : 'Bit length is required'}
                  </p>
                )}
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-1">Security Information</h3>
                  <p className="text-sm text-blue-700">
                    The private key will be generated securely on the server and encrypted. 
                    You'll have a limited time to download it before it's permanently deleted.
                  </p>
                </div>
              </div>
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
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Generate Key</span>
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

export default GenerateKeyModal; 