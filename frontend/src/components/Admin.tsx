import React, { useEffect, useState } from 'react';
import api from '../services/api';

type ManagedHost = { id: string; hostname: string; address: string; os_family: string };

const Admin: React.FC = () => {
  const [hosts, setHosts] = useState<ManagedHost[]>([]);
  const [hostname, setHostname] = useState('hpc-node-1');
  const [address, setAddress] = useState('10.0.0.10');
  const [osFamily, setOsFamily] = useState('linux');
  const [username, setUsername] = useState('hpcuser');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const r = await api.getManagedHosts();
      if (r.success && r.data) {
        const list = (r.data as any).hosts || (r.data as any);
        setHosts(list as ManagedHost[]);
      }
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const addHost = async () => {
    setMessage('');
    await api.addManagedHost(hostname, address, osFamily);
    await load();
  };

  const apply = async () => {
    setMessage('');
    const r = await api.applyAuthorizedKeys(username);
    if (r.success && r.data) setMessage(`Applied to ${(r.data as any).applied.length} hosts; checksum ${(r.data as any).checksum.substring(0,8)}...`);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin</h1>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-3">Add Managed Host</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="border rounded p-2" value={hostname} onChange={e=>setHostname(e.target.value)} placeholder="hostname" />
          <input className="border rounded p-2" value={address} onChange={e=>setAddress(e.target.value)} placeholder="address" />
          <input className="border rounded p-2" value={osFamily} onChange={e=>setOsFamily(e.target.value)} placeholder="os family" />
          <button onClick={addHost} className="bg-blue-600 text-white rounded p-2">Add</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="font-semibold mb-3">Trigger Apply</h2>
        <div className="flex gap-2">
          <input className="border rounded p-2 flex-1" value={username} onChange={e=>setUsername(e.target.value)} placeholder="remote username" />
          <button onClick={apply} className="bg-green-600 text-white rounded p-2">Apply to All Hosts</button>
        </div>
        {message && <p className="text-sm text-gray-700 mt-2">{message}</p>}
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="font-semibold mb-3">Managed Hosts</h2>
        <ul className="list-disc pl-5">
          {hosts.map((h)=> (
            <li key={h.id}>{h.hostname} — {h.address} ({h.os_family})</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Admin; 