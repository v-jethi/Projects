# Backend API Setup

## Configuration Required

You need to update the `config.py` file with the path to your ComfyUI workflows directory.

### Steps:

1. Open `Backend-API/config.py`
2. Find the line: `COMFYUI_WORKFLOWS_DIR = ...`
3. Update it with the full path to your ComfyUI workflows folder

### Example:

If your ComfyUI is located at `C:\Users\YourName\ComfyUI\workflows`, update it like this:

```python
COMFYUI_WORKFLOWS_DIR = "C:/Users/YourName/ComfyUI/workflows"
```

**Note:** Use forward slashes (`/`) in the path, even on Windows.

### Finding Your Workflows Directory

Your workflows are typically located in one of these places:
- `ComfyUI/workflows/` - Main workflows folder
- `ComfyUI/custom_nodes/SomeNode/workflows/` - Custom node workflows
- Any folder where you've saved your `.json` workflow files

The scanner will recursively search for all `.json` files in the specified directory and subdirectories.

