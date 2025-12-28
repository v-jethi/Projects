import os
import json
from pathlib import Path
from typing import List, Dict

class WorkflowScanner:
    """Scans a directory for ComfyUI workflow JSON files."""
    
    def __init__(self, workflows_directory: str):                         #This function initializes the workflow scanner.
        """
        Initialize the workflow scanner.
        
        Args:
            workflows_directory: Path to the directory containing workflow JSON files
        """
        self.workflows_directory = Path(workflows_directory)
    
    def scan_workflows(self) -> List[Dict[str, str]]:                   #This function scans the workflows directory for JSON files.
        """
        Scan the workflows directory for JSON files.
        
        Returns:
            List of dictionaries containing workflow information:
            [
                {
                    'name': 'workflow_name',
                    'filename': 'workflow.json',
                    'path': 'full/path/to/workflow.json'
                },
                ...
            ]
        """
        workflows = []
        
        if not self.workflows_directory.exists():
            return workflows
        
        # Scan for JSON files
        for file_path in self.workflows_directory.rglob('*.json'):
            try:
                # Get relative path from workflows directory
                relative_path = file_path.relative_to(self.workflows_directory)
                
                # Extract name from filename (without extension)
                name = file_path.stem
                
                workflows.append({
                    'name': name,
                    'filename': str(relative_path),
                    'path': str(file_path)
                })
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
                continue
        
        # Sort by name
        workflows.sort(key=lambda x: x['name'].lower())
        
        return workflows
    
    def get_workflow_content(self, filename: str) -> Dict:                   #This function loads and returns the content of a specific workflow file.
        """
        Load and return the content of a specific workflow file.
        
        Args:
            filename: Relative filename from workflows directory
            
        Returns:
            Dictionary containing the workflow JSON content
        """
        workflow_path = self.workflows_directory / filename
        
        if not workflow_path.exists():
            raise FileNotFoundError(f"Workflow not found: {filename}")
        
        with open(workflow_path, 'r', encoding='utf-8') as f:
            return json.load(f)

