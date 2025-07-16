'use client';
import { useState, useEffect } from 'react';

export default function LookalikeJobDebugger({ listId }: { listId: string }) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDebugInfo = async () => {
    try {
      const response = await fetch(`/api/lists/${listId}/lookalike/debug`);
      const data = await response.json();
      if (data.success) {
        setDebugInfo(data.data);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Failed to fetch debug info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
    // Poll every 5 seconds
    const interval = setInterval(fetchDebugInfo, 5000);
    return () => clearInterval(interval);
  }, [listId]);

  if (loading) return <div>Loading debug info...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!debugInfo) return <div>No debug info available</div>;

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Debug Information</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold">List Status</h4>
        <pre>{JSON.stringify(debugInfo.list, null, 2)}</pre>
      </div>

      <div>
        <h4 className="font-semibold">Jobs</h4>
        {debugInfo.jobs.map((job: any) => (
          <div key={job._id} className="mb-2 p-2 bg-white rounded">
            <pre>{JSON.stringify(job, null, 2)}</pre>
          </div>
        ))}
      </div>

      <button 
        onClick={fetchDebugInfo}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Refresh
      </button>
    </div>
  );
} 