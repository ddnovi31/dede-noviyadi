export interface SavedProject {
  id: string;
  name: string;
  items: any[];
  updatedAt: number;
}

export async function initDB(): Promise<void> {
  const response = await fetch('/api/projects/reset', {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to reset database');
  }
}

export async function saveProjectToDB(project: SavedProject): Promise<void> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  });
  if (!response.ok) {
    throw new Error('Failed to save project');
  }
}

export async function getProjectsFromDB(): Promise<SavedProject[]> {
  const response = await fetch('/api/projects');
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
}

export async function deleteProjectFromDB(id: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete project');
  }
}
