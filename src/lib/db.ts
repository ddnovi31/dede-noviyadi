export interface SavedProject {
  id: string;
  name: string;
  items: any[];
  updatedAt: number;
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
