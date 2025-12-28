import json
from typing import Any, Dict, List, Optional


class WorkflowParser:
    """Very small generalized parser:
    - Does not rely on known node types
    - For each node returns: id, type (string), inputs (list of input.type strings for inputs with link==null), outputs (list of output.type strings)
    """

    def __init__(self, workflow_data: Dict[str, Any]):
        self.workflow_data = workflow_data or {}
        self.nodes = self.workflow_data.get('nodes') or []
        self.links = self.workflow_data.get('links') or []

    def parse(self) -> Dict[str, Any]:
        try:
            parsed_nodes: List[Dict[str, Any]] = []

            for node in self.nodes:
                node_id = node.get('id')
                node_type = node.get('type')

                # Inputs: per new rule - only include inputs that:
                #  - have link == None (unlinked)
                #  - have a 'widget' subsection with a 'name' string
                inputs: List[Dict[str, str]] = []
                for inp in (node.get('inputs') or []):
                    if not isinstance(inp, dict):
                        continue
                    link = inp.get('link')
                    # skip inputs that are linked
                    if link is not None:
                        continue
                    widget = inp.get('widget')
                    if not isinstance(widget, dict):
                        # per requirement: ignore inputs without a widget
                        continue
                    wname = widget.get('name')
                    if not isinstance(wname, str):
                        continue
                    # Also capture the original input 'type' string so frontend
                    # can decide which input control to show (INT, FLOAT, COMBO, etc.)
                    raw_type = str(inp.get('type') or '')
                    inputs.append({
                        'widget_name': wname,
                        'raw_type': raw_type
                    })

                # Outputs: include output.type strings only when the output's 'links'
                # field is NOT null (literal null). If 'links' is null, skip it.
                outputs: List[str] = []
                for out in (node.get('outputs') or []):
                    if not isinstance(out, dict):
                        continue
                    links = out.get('links') if 'links' in out else None
                    # If links is explicitly null/None, skip this output
                    if links is None:
                        continue
                    t = out.get('type')
                    if not isinstance(t, str):
                        t = ''
                    outputs.append(t)

                parsed_nodes.append({
                    'node_id': node_id,
                    'node_type': node_type,
                    'inputs': inputs,
                    'outputs': outputs,
                })

            return {
                'nodes': parsed_nodes,
                'workflow_info': {
                    'total_nodes': len(self.nodes),
                    'total_links': len(self.links),
                }
            }
        except Exception as e:
            return {
                'nodes': [],
                'workflow_info': {
                    'total_nodes': len(self.nodes) if isinstance(self.nodes, list) else 0,
                    'total_links': len(self.links) if isinstance(self.links, list) else 0,
                },
                'error': f'parse error: {str(e)}'
            }

    @staticmethod
    def parse_workflow_file(file_path: str) -> Dict[str, Any]:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return WorkflowParser(data).parse()

    @staticmethod
    def parse_workflow_json(workflow_json: str) -> Dict[str, Any]:
        data = json.loads(workflow_json)
        return WorkflowParser(data).parse()
