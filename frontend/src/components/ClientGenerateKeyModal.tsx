import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import apiService from '../services/api';
import i18n from '../services/i18n';
import { X, Download, AlertCircle, Shield, Copy, Key } from 'lucide-react';

interface ClientGenerateKeyForm {
  algorithm: string;
  bitLength: number;
  comment: string;
  expiresAt: string;
  authorizedKeysOptions: string;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const ClientGenerateKeyModal: React.FC<Props> = ({ onClose, onSuccess }: Props) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string>('');
  const [generatedKeys, setGeneratedKeys] = useState<{
    publicKey: string;
    privateKey: string;
    fingerprint: string;
  } | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  // Listen for language changes and force re-render
  useEffect(() => {
    const handleLanguageChange = (language: any, direction: any) => {
      setRenderKey(prev => prev + 1);
    };

    i18n.addLanguageChangeListener(handleLanguageChange);
    
    return () => {
      i18n.removeLanguageChangeListener(handleLanguageChange);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ClientGenerateKeyForm>({
    defaultValues: {
      algorithm: 'ssh-rsa',
      bitLength: 2048,
      comment: '',
      expiresAt: '',
      authorizedKeysOptions: ''
    }
  });

  const generateKeyPair = async (algorithm: string, bitLength: number): Promise<{ publicKey: string; privateKey: string }> => {
    if (!window.crypto?.subtle) {
      throw new Error('Web Crypto API not supported in this browser');
    }

    let keyPair: CryptoKeyPair;
    let publicKeyFormat: string;
    let algorithmName: string;

    if (algorithm === 'ssh-rsa') {
      keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: bitLength,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
      );
      algorithmName = 'ssh-rsa';
    } else if (algorithm.startsWith('ecdsa-sha2-nistp')) {
      let namedCurve: string;
      if (algorithm === 'ecdsa-sha2-nistp256') {
        namedCurve = 'P-256';
      } else if (algorithm === 'ecdsa-sha2-nistp384') {
        namedCurve = 'P-384';
      } else if (algorithm === 'ecdsa-sha2-nistp521') {
        namedCurve = 'P-521';
      } else {
        throw new Error(`Unsupported ECDSA curve: ${algorithm}`);
      }

      keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: namedCurve,
        },
        true,
        ['sign', 'verify']
      );
      algorithmName = algorithm;
    } else {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    // Export keys
    const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    // Convert to PEM format
    const publicKeyPem = arrayBufferToPem(publicKeyBuffer, 'PUBLIC KEY');
    const privateKeyPem = arrayBufferToPem(privateKeyBuffer, 'PRIVATE KEY');

    // Note: Converting to OpenSSH format would require additional libraries
    // For now, we'll return PEM format with a note to users
    return {
      publicKey: `# This is a PEM format key - you may need to convert to OpenSSH format\n# Algorithm: ${algorithmName}\n${publicKeyPem}`,
      privateKey: privateKeyPem
    };
  };

  const arrayBufferToPem = (buffer: ArrayBuffer, label: string): string => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
    return `-----BEGIN ${label}-----\n${formatted}\n-----END ${label}-----`;
  };

  const onGenerate = async (data: ClientGenerateKeyForm) => {
    setIsGenerating(true);
    setError('');

    try {
      const keys = await generateKeyPair(data.algorithm, data.bitLength);
      
      // Calculate a simple fingerprint (not SHA256 like SSH, but for display)
      const encoder = new TextEncoder();
      const keyData = encoder.encode(keys.publicKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fingerprint = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

      setGeneratedKeys({
        ...keys,
        fingerprint: fingerprint
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate key pair');
    } finally {
      setIsGenerating(false);
    }
  };

  const onImportGenerated = async () => {
    if (!generatedKeys) return;

    setIsImporting(true);
    setError('');

    try {
      const form = document.querySelector('form') as HTMLFormElement;
      const formData = new FormData(form);
      
      const response = await apiService.importKey(
        generatedKeys.publicKey,
        formData.get('comment') as string || undefined,
        formData.get('expiresAt') as string || undefined,
        formData.get('authorizedKeysOptions') as string || undefined
      );

      if (response.success) {
        onSuccess();
      } else {
        setError(response.error || 'Failed to import generated key');
      }
    } catch (err) {
      setError('Failed to import generated key');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadPrivateKey = () => {
    if (!generatedKeys) return;

    const blob = new Blob([generatedKeys.privateKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `id_${generatedKeys.fingerprint.substring(0, 8)}.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  if (generatedKeys) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <Shield className="w-6 h-6 text-green-600" />
              <span>Key Pair Generated</span>
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Important Security Notice</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Download and securely store your private key immediately</li>
                    <li>• The private key will not be stored on the server</li>
                    <li>• You may need to convert the key format for some SSH clients</li>
                    <li>• Never share your private key with anyone</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Public Key:</label>
                <textarea
                  value={generatedKeys.publicKey}
                  readOnly
                  className="w-full h-32 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono resize-none"
                />
                <button
                  onClick={() => copyToClipboard(generatedKeys.publicKey)}
                  className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center space-x-1"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Private Key:</label>
                <textarea
                  value={generatedKeys.privateKey}
                  readOnly
                  className="w-full h-32 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono resize-none"
                />
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={downloadPrivateKey}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => copyToClipboard(generatedKeys.privateKey)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center space-x-1"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onImportGenerated)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comment (optional)</label>
                  <input
                    {...register('comment')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., laptop-work, desktop-home"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date (optional)</label>
                  <input
                    {...register('expiresAt')}
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Authorized Keys Options (optional)</label>
                <input
                  {...register('authorizedKeysOptions')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., no-agent-forwarding,from=192.168.1.0/24"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

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
                  disabled={isImporting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center space-x-2"
                >
                  {isImporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Import Public Key</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Key className="w-6 h-6 text-blue-600" />
            <span>{i18n.t('modal.generateClientKey')}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onGenerate)} className="space-y-6">
            <div>
              <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700 mb-2">
                {i18n.t('form.algorithm')} *
              </label>
              <select
                {...register('algorithm', { required: 'Algorithm is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="ssh-rsa">RSA (Recommended for browser generation)</option>
                <option value="ecdsa-sha2-nistp256">ECDSA P-256</option>
                <option value="ecdsa-sha2-nistp384">ECDSA P-384</option>
                <option value="ecdsa-sha2-nistp521">ECDSA P-521</option>
              </select>
              {errors.algorithm && (
                <p className="mt-1 text-sm text-red-600">
                  {typeof errors.algorithm.message === 'string' 
                    ? errors.algorithm.message 
                    : 'Algorithm is required'}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="bitLength" className="block text-sm font-medium text-gray-700 mb-2">
                {i18n.t('form.keyLength')} *
              </label>
              <select
                {...register('bitLength', { required: 'Key length is required', valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-1">{i18n.t('modal.clientSideGeneration')}</h3>
                  <p className="text-sm text-blue-700">
                    {i18n.t('modal.clientSideGenerationDesc')}
                  </p>
                </div>
              </div>
            </div>

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
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Generate Key Pair</span>
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

export default ClientGenerateKeyModal; 