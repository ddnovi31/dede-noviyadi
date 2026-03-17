export interface SavedProject {
  id: string;
  name: string;
  projectNumber?: string;
  items: any[];
  updatedAt: number;
}

export async function setDbHandle(handle: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cable-db-local', 1);
    request.onupgradeneeded = (e: any) => e.target.result.createObjectStore('handles');
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('handles')) return resolve();
      const tx = db.transaction('handles', 'readwrite');
      const putReq = tx.objectStore('handles').put(handle, 'dbFileHandle');
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getDbHandle(): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cable-db-local', 1);
    request.onupgradeneeded = (e: any) => e.target.result.createObjectStore('handles');
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('handles')) return resolve(null);
      const tx = db.transaction('handles', 'readonly');
      const getReq = tx.objectStore('handles').get('dbFileHandle');
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function initDB(): Promise<void> {
  // Initialization is handled by the backend server now.
  return Promise.resolve();
}

export async function saveProjectToDB(project: SavedProject): Promise<void> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(project)
  });
  
  if (!response.ok) {
    throw new Error('Failed to save project to database');
  }
}

export async function getProjectsFromDB(): Promise<SavedProject[]> {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to fetch projects from database');
  }
  return response.json();
}

export async function deleteProjectFromDB(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Failed to delete project from database');
  }
}
