import os
from pathlib import Path
from typing import List, Dict, Optional

class ModelScanner:
    """Scans ComfyUI models directory and organizes models by folder structure."""
    
    # Common model file extensions (but we'll accept any file)
    COMMON_MODEL_EXTENSIONS = {
        '.ckpt', '.safetensors', '.pt', '.pth', '.bin',
        '.onnx', '.tflite', '.pb', '.h5', '.pkl', '.pickle'
    }
    
    def __init__(self, models_directory: str):
        """
        Initialize the model scanner.
        
        Args:
            models_directory: Path to the ComfyUI models directory
        """
        self.models_directory = Path(models_directory)
    
    def scan_models(self) -> Dict:
        """
        Scan the models directory and return a nested tree structure.
        Includes ALL directories and ALL files (no filtering by extension).
        
        Returns:
            Nested dictionary structure:
            {
                'type': 'directory',
                'name': 'models',
                'children': [
                    {
                        'type': 'file',
                        'name': 'file.ckpt',
                        'path': 'file.ckpt',
                        'full_path': '...'
                    },
                    {
                        'type': 'directory',
                        'name': 'checkpoints',
                        'path': 'checkpoints',
                        'children': [
                            {
                                'type': 'file',
                                'name': 'model.ckpt',
                                'path': 'checkpoints/model.ckpt',
                                'full_path': '...'
                            },
                            ...
                        ]
                    },
                    ...
                ]
            }
        """
        if not self.models_directory.exists():
            return {'type': 'directory', 'name': 'models', 'children': []}
        
        return self._build_tree(self.models_directory, '')
    
    def _build_tree(self, directory: Path, relative_path: str) -> Dict:
        """
        Build a nested tree structure for a directory.
        
        Args:
            directory: Path to scan
            relative_path: Relative path from models directory
            
        Returns:
            Dictionary representing the directory tree
        """
        children = []
        
        # Get all items and sort: directories first, then files
        items = sorted(directory.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
        
        for item in items:
            if item.is_file():
                # File
                try:
                    file_relative_path = item.relative_to(self.models_directory)
                    children.append({
                        'type': 'file',
                        'name': item.name,
                        'path': str(file_relative_path).replace('\\', '/'),
                        'full_path': str(item)
                    })
                except ValueError:
                    path = f"{relative_path}/{item.name}" if relative_path else item.name
                    children.append({
                        'type': 'file',
                        'name': item.name,
                        'path': path.replace('\\', '/'),
                        'full_path': str(item)
                    })
            elif item.is_dir():
                # Directory - recursively build tree
                dir_relative_path = item.relative_to(self.models_directory) if relative_path == '' else f"{relative_path}/{item.name}"
                dir_tree = self._build_tree(item, str(dir_relative_path).replace('\\', '/'))
                # Only add directory if it has children (not empty)
                if dir_tree.get('children'):
                    children.append(dir_tree)
        
        # Build result
        if relative_path == '':
            return {
                'type': 'directory',
                'name': 'models',
                'path': '',
                'children': children
            }
        else:
            return {
                'type': 'directory',
                'name': directory.name,
                'path': relative_path.replace('\\', '/'),
                'children': children
            }
    
    def get_all_models_flat(self) -> List[Dict[str, str]]:
        """
        Get all models as a flat list with folder information.
        
        Returns:
            List of models with folder info:
            [
                {
                    'name': 'model.ckpt',
                    'path': 'checkpoints/model.ckpt',
                    'folder': 'checkpoints',
                    'full_path': '...'
                },
                ...
            ]
        """
        models_by_folder = self.scan_models()
        flat_list = []
        
        for folder, models in models_by_folder.items():
            for model in models:
                flat_list.append({
                    **model,
                    'folder': folder
                })
        
        return flat_list
    
    def get_models_by_type(self, model_type: str) -> List[Dict[str, str]]:
        """
        Get models from a specific folder type.
        
        Args:
            model_type: Type of model (e.g., 'checkpoints', 'loras', 'vae')
            
        Returns:
            List of models in that folder
        """
        models_by_folder = self.scan_models()
        return models_by_folder.get(model_type, [])

