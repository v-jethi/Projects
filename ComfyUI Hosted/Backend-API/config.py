import os

# Path to your ComfyUI workflows directory
# Update this path to point to where your ComfyUI workflow JSON files are stored
# Example: "C:/Users/YourName/ComfyUI/workflows"
# Or if workflows are in a subdirectory: "C:/Users/YourName/ComfyUI/custom_nodes/workflows"

COMFYUI_WORKFLOWS_DIR = "C:/Users/varda/Documents/ComfyUI Portable/ComfyUI_windows_portable/ComfyUI/user/default/workflows"

# Path to your ComfyUI models directory
# Update this path to point to where your ComfyUI models are stored
# Example: "C:/Users/YourName/ComfyUI/models"
COMFYUI_MODELS_DIR = "D:/ComfyUI/models"

# ComfyUI server configuration
COMFYUI_HOST = "localhost"              #Localhost is the server running on the same machine as the client.
COMFYUI_PORT = 8188                                     #Default port for ComfyUI server.
COMFYUI_URL = f"http://{COMFYUI_HOST}:{COMFYUI_PORT}"       #URL to connect to the ComfyUI server.

# Optional media directory used to populate image/video dropdowns in the UI.
# Set this to an absolute path that contains images/videos organized in subfolders.
# Example: "C:/Users/YourName/Videos". Leave empty to disable the media listing endpoint.
COMFYUI_MEDIA_DIR = "C:/Users/varda/Documents/ComfyUI/input"

